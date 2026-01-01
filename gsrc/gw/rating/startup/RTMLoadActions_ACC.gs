package gw.rating.startup

uses com.google.common.base.Stopwatch
uses gw.api.database.Query
uses gw.api.system.PCConfigParameters
uses gw.api.system.PCDependenciesGateway
uses gw.api.system.PCLoggerCategory
uses gw.pl.util.MemoryUsage
uses gw.plugin.Plugins
uses gw.plugin.rateflow.RateBookPreloadPlugin
uses gw.rating.flow.domain.CalcRoutine
uses gw.rating.flow.domain.util.RateRoutinesJarUpdateHandler
uses gw.rating.flow.util.RatingEntityGraphTraverser
uses gw.rating.rtm.query.StatelessMemoryQuery
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC

uses java.io.File
uses java.util.concurrent.TimeUnit
uses java.util.concurrent.atomic.AtomicInteger
uses java.util.jar.JarFile
uses java.util.stream.Stream
uses java.util.stream.StreamSupport

/**
 * This was copied from OOTB RTMLoadActions.gs
 *
 * Added function loadRatingRoutines_ACC to fix a deadlock issue
 *
 * This deadlock issue is fixed in GW 10.2.2
 * This custom class should be deleted when we upgrade to 10.2.2
 */
class RTMLoadActions_ACC {
  private static final var _log = PCLoggerCategory.RTM

  public static function primeForAllRateBooks() {
    if (PCConfigParameters.EnableRateRoutinesJar.Value) {
      if (not PCConfigParameters.RateRoutinesJarFile.Value.HasContent) {
        throw new IllegalStateException("EnableRateRoutinesJar is true, but RateRoutinesJarFile is not specified")
      }

      if (PCConfigParameters.RateRoutinesUpdateJarFile.Value.HasContent and
          new File(PCConfigParameters.RateRoutinesUpdateJarFile.Value).exists()) {
        throw new IllegalStateException("Update JAR '${PCConfigParameters.RateRoutinesUpdateJarFile.Value}' must not exist")
      }
    }

    System.gc()
    MemoryUsage.printMemoryUsage(_log)

    /*
     * If the logging for these caches is the 1st time they are accessed, then
     * they will be explicitly loaded now even though the load actions would
     * also be effected by CalcRoutine loading as a side-effect. This loading
     * should not take too long and doing so now whether CalcRoutine or
     * RateTable loading is disabled below will control possible lock contention
     * better. No ordering dependencies exist, but CalcRoutine loading does use
     * the RateTableDefinitionCache.
     */
    logRateTableCacheStatistics()
    logRateBookCacheStatistics()

    if (PCConfigParameters.RateBookPreloadEnabled.Value) {
      final var stopwatch = Stopwatch.createStarted()
      try {
        loadRatingRoutines_ACC()
      } finally {
        _log.info("RTM Priming completed in ${stopwatch.elapsed(TimeUnit.SECONDS)} seconds.")

        System.gc()
        MemoryUsage.printMemoryUsage(_log)

        logStatistics()
      }
    } else if (PCConfigParameters.EnableRateRoutinesJar.Value) {
      // No preloading; just update the jar.
      updateRateRoutinesJar()
    }
  }

  public static function loadRatingRoutines() {
    final var rateBooksToPreload = lookupRateBooksToPreload()

    /**
     * Load rate routines and rate tables in parallel.
     */
    new ArrayList({CalcRoutine, RateTable}).parallelStream().forEach(\elt -> {
      if (elt == CalcRoutine) {
        if (PCConfigParameters.EnableRateRoutinesJar.Value and PCConfigParameters.RateRoutinesJarFile.Value.HasContent) {
          loadCalcRoutinesForRateBooksFromJar(lookupRateBooksToExportToJAR())
        } else {
          loadCalcRoutinesForRateBooks(rateBooksToPreload)
        }
      } else {
        loadRateTablesForRateBooks(rateBooksToPreload)
      }
    })
  }

  /**
   * Replacing OOTB function with this fix backported from GW 10.2.2
   *
   * Refer to GW support case:
   * https://community.guidewire.com/s/case/5003n00002esZhIAAU/bug-report-deadlock-detected-while-loading-classes
   */
  public static function loadRatingRoutines_ACC() {
    StructuredLogger_ACC.CONFIG.info("loadRatingRoutines_ACC() - Loading rate routines with serial stream as workaround for deadlock issue")
    final var rateBooksToPreload = lookupRateBooksToPreload()

    if (PCConfigParameters.EnableRateRoutinesJar.Value
        and PCConfigParameters.RateRoutinesJarFile.Value.HasContent) {
      loadCalcRoutinesForRateBooksFromJar(rateBooksToPreload)
    } else {
      loadCalcRoutinesForRateBooks(rateBooksToPreload)
    }

    loadRateTablesForRateBooks(rateBooksToPreload)
  }

  protected static function loadCalcRoutinesForRateBooksFromJar(rateBooksToPreload : Iterable<RateBook>) {
    var missing = loadRateRoutinesFromJar(rateBooksToPreload, PCConfigParameters.RateRoutinesJarFile.Value)

    if (missing.HasElements) {
      _log.info("Attempting to load ${missing.size()} rate routines not in JAR")

      var errorCount = new AtomicInteger(0)

      var missingDefsStream = missing.stream()
      if (PCConfigParameters.ParallelStreamsForRateRoutinesLoad.Value) {
        missingDefsStream = missingDefsStream.parallel()
      }

      missingDefsStream.forEach(\def -> {
        try {
          CalcRoutine.update(def)
        } catch (ignore) {
          errorCount.incrementAndGet()
        }
      })

      var loadedCount = missing.size() - errorCount.get()

      _log.info("Loaded ${loadedCount} rate routines not in JAR with ${errorCount.get()} errors")

      if (errorCount.get() > 0) {
        throw new IllegalStateException("Failed to load all rate routines: missing ${missing.size()}, errors ${errorCount.get()}")
      }
    }

    updateRateRoutinesJar()
  }

  protected static function loadRateRoutinesFromJar(rateBooks : Iterable<RateBook>, jarPath : String): Collection<CalcRoutineDefinition> {
    var allCalcRoutineDefs = new HashSet<CalcRoutineDefinition>()
    StreamSupport.stream(rateBooks.spliterator(), false)
        .forEach(\book -> Arrays.stream(book.RateBookCalcRoutines)
            .forEach(\routine -> allCalcRoutineDefs.add(routine.CalcRoutineDefinition)))

    if (not new File(jarPath).exists()) {
      return allCalcRoutineDefs
    }

    /**
     * Have to do it this way rather than just trying to load routines for all definitions because of the way the
     * typesystem behaves. If you try to access a type and it does not exist, the typesystem will remember that fact.
     * You can't later create the type.
     */
    var errorCount = 0
    var missingDefCount = 0
    var jarDefinitions = new ArrayList<CalcRoutineDefinition>()
    using (var jarFile = new JarFile(jarPath)) {
      var entries = jarFile.entries()

      while (entries.hasMoreElements()) {
        var entry = entries.nextElement()
        if (not entry.Directory and entry.Name.endsWith(".gs")) {
          var className = entry.Name.substring(0, entry.Name.length() - 3).replaceAll("[/\\\\]", ".")

          try {
            var routine = CalcRoutine.create(className)
            // Repeats what CalcRoutine.create(className) does, but its unavoidable, and hopefully just comes from cache.
            var definition = Query.make(CalcRoutineDefinition)
                .compare(CalcRoutineDefinition#PublicID, Equals, routine.PublicID)
                .select()
                .AtMostOneRow
            jarDefinitions.add(definition)
          } catch (classNotFoundEx : ClassNotFoundException) {
            // Something very badly wrong: entry in JAR but class cannot be loaded.
            _log.error("Unexpected error loading rate routine '${className}' from JAR", classNotFoundEx)
            errorCount++
          } catch (ignore : IllegalStateException) {
            // Routine could be loaded, but no definition could be found. This may happen if rate book yet to be imported.
            missingDefCount++
          } catch (ex) {
            _log.error("Exception loading rate routine '${className}' from JAR", ex)
            errorCount++
          }
        }
      }
    }

    _log.info("Loaded ${jarDefinitions.size()} rate routines from JAR. No definition found for ${missingDefCount} routines in JAR")

    if (errorCount > 0) {
      throw new IllegalStateException("Encountered ${errorCount} error(s) in loading rate routines from JAR")
    }

    allCalcRoutineDefs.removeAll(jarDefinitions)
    return allCalcRoutineDefs
  }

  protected static function updateRateRoutinesJar() {
    RateRoutinesJarUpdateHandler.update()  // Synchronous
  }

  protected static function lookupRateBooksToPreload(): Iterable<RateBook> {
    var plugin = Plugins.get(RateBookPreloadPlugin)

    return plugin == null ? Collections.emptyList() : plugin.RateBooksToPreload
  }

  protected static function lookupRateBooksToExportToJAR(): Iterable<RateBook> {
    var plugin = Plugins.get(RateBookPreloadPlugin)

    return plugin == null ? Collections.emptyList() : plugin.RateBooksToExportToJAR
  }

  protected static function loadRateTablesForRateBooks(rateBooks: Iterable<RateBook>): int {
    var loadedRateTableCount = new AtomicInteger(0)

    var rateBooksStream = Stream.of(rateBooks*.RateTables)
    if (PCConfigParameters.ParallelStreamsForRateTablesLoad.Value) {
      rateBooksStream = rateBooksStream.parallel()
    }
    
    rateBooksStream.filter(\table -> table.QueryStrategy == FactorQueryStrategy.TC_MEMORY)
        .forEach(\table -> {
          loadRateTable(table)
          loadedRateTableCount.incrementAndGet()
        })

    return loadedRateTableCount.get()
  }

  protected static function loadRateTable(table: RateTable) {
    //try to execute a query on rate table given RateQueryParam set for table
    var matchOps = StatelessMemoryQuery.getMatchOperators(table.Definition)
    var comparableArray = matchOps.map( \ matchOp -> null as Comparable).toTypedArray()
    var query = new StatelessMemoryQuery(table)
    query.query<Comparable>(table, comparableArray, null)
  }

  protected static function loadCalcRoutinesForRateBooks(rateBooks: Iterable<RateBook>): int {
    var totalCount = new AtomicInteger(0)
    var totalErrorCount = new AtomicInteger(0)

    var allCalcRoutineDefs = new ArrayList<CalcRoutineDefinition>() as List<CalcRoutineDefinition>
    StreamSupport.stream(rateBooks.spliterator(), false)
        .forEach(\book -> Arrays.stream(book.RateBookCalcRoutines)
            .forEach(\routine -> allCalcRoutineDefs.add(routine.CalcRoutineDefinition)))

    var definitionsStream = allCalcRoutineDefs.toSet().stream()

    if (PCConfigParameters.ParallelStreamsForRateRoutinesLoad.Value) {
      definitionsStream = definitionsStream.parallel()
    }

    definitionsStream.forEach(\def -> {
      var count = totalCount.incrementAndGet()
      try {
        loadRateRoutine(def)
      } catch (ex) {
        _log.error("Error creating routine ${def.Code} v${def.Version}: ${ex.Message}", ex)
        totalErrorCount.incrementAndGet()
      }

      if (count % 1000 == 0) {
        _log.info("Processed ${count} rate routine defintions with ${totalErrorCount.get()} errors.")
      }
    })

    if (totalErrorCount.get() > 0) {
      throw new IllegalStateException("Error(s) encountered in loading CalcRoutines: ${totalErrorCount.get()} errors in ${totalCount.get()} routines.")
    }

    return totalCount.get() - totalErrorCount.get()
  }

  protected static function loadRateRoutine(def: CalcRoutineDefinition) {
    CalcRoutine.create(def)
  }

  /**
   * Primes the {@link RatingEntityGraphTraverser} for use during editing of
   * {@link CalcRoutineDefinition rate routine definition}s.
   */
  internal static function primeCachesForAllParameterSets() {
    var parametersSets = Query.make(CalcRoutineParameterSet).select()

    var mapThread = new Thread(new RatingEntityGraphTraverserInitializer("initializeMapFromParameterSet",
    StreamSupport.stream(parametersSets.spliterator(), true),
        \parameterSet -> RatingEntityGraphTraverser.initializeMapFromParameterSet(parameterSet)),
        "REGT_MapInitializer"
    )

    var targetThread = new Thread(new RatingEntityGraphTraverserInitializer("getWritableTargetElements",
    StreamSupport.stream(parametersSets.spliterator(), true),
        \parameterSet -> RatingEntityGraphTraverser.getWritableTargetElements(parameterSet)),
        "REGT_TargetElementsInitializer"
    )

    if (PCConfigParameters.AsyncParameterSetPreload.Value) {
      _log.info("Loading parameter sets related caches asynchronously.")

      mapThread.setDaemon(true)
      mapThread.start()

      targetThread.setDaemon(true)
      targetThread.start()
    } else {
      _log.info("Loading parameter sets related caches synchronously.")

      mapThread.start()
      targetThread.start()

      try {
        mapThread.join()
      } catch(interruptedEx: InterruptedException) {
        // See https://www.ibm.com/developerworks/library/j-jtp05236/index.html
        Thread.currentThread().interrupt()
      }

      try {
        targetThread.join()
      } catch(interruptedEx: InterruptedException) {
        Thread.currentThread().interrupt()
      }
    }
  }

  protected static function logRateBookCacheStatistics() {
    // AllRateBooks will load cache if necessary...
    logRateBookStatistics(PCDependenciesGateway.RateBookCache.AllRateBooks)
  }

  protected static function logRateBookStatistics(rateBooks: List<RateBook>) {
    final var booksByPolicyLines = rateBooks.partition(\book -> book.PolicyLine)
    final var log = PCLoggerCategory.RTM

    booksByPolicyLines.keySet().each(\line -> {
      var lineIdentification = getLineIdentification(line)
      log.info(lineIdentification + booksByPolicyLines.get(line).Count + " RateBooks")
    })
  }

  protected static function logRateTableCacheStatistics() {
    // findAllRateTableDefinitions will load cache if necessary...
    logRateTableStatistics(PCDependenciesGateway.RateTableDefinitionCache.findAllRateTableDefinitions())
  }

  protected static function logRateTableStatistics(rateTables: List<RateTableDefinition>) {
    final var tablesByPolicyLines = rateTables.partition(\table -> table.PolicyLine)
    final var log = PCLoggerCategory.RTM

    tablesByPolicyLines.keySet().each(\line ->
        log.info(getLineIdentification(line) + tablesByPolicyLines.get(line).Count + " RateTables")
    )
  }

  private static function getLineIdentification(policyLine: String): String {
    return (policyLine == null ? "Shared" : (" Line " + policyLine)) + ": Cached "
  }

  protected static function logStatistics() {
    final var log = PCLoggerCategory.RTM
    final var cacheInfo = CalcRoutine.CacheInfo
    log.info("Loaded ${cacheInfo.CacheSize} routines")
    cacheInfo.CalcRoutinesByPolicyLineMap.entrySet().forEach(\lineEntry -> {
      final var calcRoutines = lineEntry.Value as Set<CalcRoutine>
      log.info(lineEntry.Key == null
          ? "Shared: " : (" Line " + lineEntry.Key + ": ")
          + calcRoutines.size() + " routines")
      // sort for median and can also be used for min/max
      var sortedCounts = calcRoutines.map(\routine -> routine.Expression.size).sort()
      log.info("   with " + sortedCounts.sum() + " total, "
          + sortedCounts.first() + " min, "
          + sortedCounts.last() + " max, "
          + "median " + median(sortedCounts)
          + " bytes of generated Gosu")
      // sort for median and can also be used for min/max
      sortedCounts = calcRoutines.map(\routine -> routine.StatementsCount).sort()
      log.info("   with " + sortedCounts.sum() + " total, "
          + sortedCounts.first() + " min, "
          + sortedCounts.last() + " max, "
          + "median " + median(sortedCounts)
          + " statements")
    })
  }

  protected static function median(sortedCounts: List<Integer>) : int {
    if (sortedCounts.Count % 2 == 1) {
      return sortedCounts.get(sortedCounts.Count / 2)
    }
    final var middle = sortedCounts.Count / 2
    return (sortedCounts.get(middle) + sortedCounts.get(middle - 1)) / 2
  }

  private static class RatingEntityGraphTraverserInitializer implements Runnable {
    final var _name: String
    final var _parameterSets: Stream<CalcRoutineParameterSet>
    final var _block: block(CalcRoutineParameterSet)

    construct(name: String, parameterSets: Stream<CalcRoutineParameterSet>, initializer: block(CalcRoutineParameterSet)) {
      _name = name
      _parameterSets = parameterSets
      _block = initializer
    }

    override function run() {
      var stopwatch = Stopwatch.createStarted()
      _log.info("RatingEntityGraphTraverserInitializer: ${_name} started")
      var errorCount = 0
      try {
        _parameterSets.forEach(\parameter -> _block(parameter))
      } catch (ex) {
        errorCount++
      }
      _log.info("RatingEntityGraphTraverserInitializer: ${_name} completed in ${stopwatch.elapsed(TimeUnit.SECONDS)} seconds")

      if (errorCount > 0) {
        throw new IllegalStateException("RatingEntityGraphTraverserInitializer: ${_name} encountered ${errorCount} errors")
      }
    }
  }
}
