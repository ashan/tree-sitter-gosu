package gw.job

uses com.guidewire.commons.entity.type.ThreadLocalBundleProvider
uses com.guidewire.pl.system.dependency.PLDependencies
uses entity.PolicyLine
uses gw.api.job.JobProcessLogger
uses gw.api.locale.DisplayKey
uses gw.api.productmodel.AvailabilityContextScope
uses gw.api.profiler.PCProfilerTag
uses gw.api.profiler.Profiler
uses gw.api.system.PCConfigParameters
uses gw.api.system.bundle.PCNeverPersistedBundle
uses gw.api.util.DisplayableException
uses gw.api.web.productmodel.ProductModelSyncIssue
uses gw.pl.persistence.core.Bundle
uses gw.pl.persistence.core.Key
uses gw.web.productmodel.ProductModelSyncIssueWrapper

uses java.util.concurrent.Callable
uses java.util.concurrent.ExecutionException
uses java.util.concurrent.ForkJoinPool
uses java.util.concurrent.ForkJoinTask
uses java.util.concurrent.ForkJoinWorkerThread
uses java.util.concurrent.TimeUnit
uses java.util.concurrent.TimeoutException
uses java.util.concurrent.atomic.AtomicInteger

@Export
class ProductModelValidationHelper {

  private static final var _threadPoolNumber = new AtomicInteger(1)

  /**
   * Discovers all issues with the policy graph based on what the product model allows (availability, etc.).
   * For example, this checks coverages, conditions, exclusions, modifiers, offerings, answers.
   *
   * @param branch the PolicyPeriod to check
   */
  static function checkBranchAgainstProductModel(branch: PolicyPeriod): List<ProductModelSyncIssueWrapper> {
    return PCProfilerTag.PRODUCT_MODEL_SYNC.evaluate(\p -> {
      p.setPropertyValue("SyncType", PCProfilerTag.ProductModelSyncType.Branch.name())
      using (new AvailabilityContextScope()) {
        var issues: List<ProductModelSyncIssueWrapper>

        if (parallelizeProductModelSync(branch)) {
          var numOfThreads = PCConfigParameters.MaxProductModelSyncThreadPoolSize.Value
          JobProcessLogger.logInfo("Multi-threaded product model availability checking enabled for job #${branch.Job.JobNumber} with initial thread pool size of ${numOfThreads}")
          var pool : ForkJoinPool
          try {
            //The order of these operarions is important. When creating the tasks, the "task root beans" are loaded into the current bundle.
            //As the forkjointhreadpool is created, a copy of this bundle is made to serve as seed to the thread bundles.
            //If this seed does not contain all root beans for the tasks to be executed then execution will fail.
            //When extending this code to add additional tasks, make sure the required beans for execution are loaded into the current bundle.
            var tasks = createProductModelCheckTasks(branch)
            pool = createForkJoinThreadPool(numOfThreads, branch.Bundle)
            issues = executeProductModelCheckTasks(branch, pool, tasks)
          } catch (ee: ExecutionException) {
            JobProcessLogger.logError(DisplayKey.get("Job.Process.ProductModelSync.Error.Task", branch.Job.JobNumber), ee)
            var taskException = ee.getCause()
            throw (taskException != null) ? taskException : new DisplayableException(DisplayKey.get("Job.Process.ProductModelSync.UserMessage", branch.Job.JobNumber))
          } catch (e: Exception) {
            JobProcessLogger.logError(DisplayKey.get("Job.Process.ProductModelSync.Error.SystemResources", branch.Job.JobNumber), e)
            throw new DisplayableException(DisplayKey.get("Job.Process.ProductModelSync.UserMessage", branch.Job.JobNumber))
          } finally {
            pool?.shutdownNow()
          }
        } else {
          JobProcessLogger.logInfo("Using single-threaded product model availability checking for job #${branch.Job.JobNumber}")
          issues = performProductModelChecks(branch)
        }

        JobProcessLogger.logInfo("Product model availability checking for job #${branch.Job.JobNumber} complete")
        p.setPropertyValue("NumIssues", String.valueOf(issues.size()))

        return issues
      }
    })
  }

  private static function performProductModelChecks(branch: PolicyPeriod): List<ProductModelSyncIssueWrapper> {
    var issues = new ArrayList<ProductModelSyncIssueWrapper>()
    JobProcessLogger.logInfo("Performing product model availability checks for job #${branch.Job.JobNumber}")
    branch.AllCoverables.each(\coverable -> issues.addAll(getProductModelSyncIssuesForCoverable(coverable, coverable.PolicyLine))) // For all coverables across all lines of business on the policy period

    branch.AllModifiables.each(\modifiable -> issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(modifiable.checkModifiersAgainstProductModel())))

    issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(branch.checkOfferingAgainstProductModel()))
    issues.addAll(branch.checkPolicyTermAgainstProductModel())

    // Check answers on the PolicyPeriod, PolicyLines and PolicyLocations
    issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(branch.checkAnswersAgainstProductModel()))
    branch.Lines.each(\line -> issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(line.checkAnswersAgainstProductModel())))
    branch.PolicyLocations.each(\location -> issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(location.checkAnswersAgainstProductModel())))
    return issues
  }

  private static function createProductModelCheckTasks(branch: PolicyPeriod): List<CheckProductModelTask> {
    var tasks = new ArrayList<CheckProductModelTask>()
    JobProcessLogger.logInfo("Creating product model availability check tasks for job #${branch.Job.JobNumber}")

    // For all coverables across all lines of business on the policy period
    branch.AllCoverables.each(\coverable -> {
      tasks.add(new CheckCoverableCoveragesTask(coverable))
      tasks.add(new CheckCoverableConditionsTask(coverable))
      tasks.add(new CheckCoverableExclusionsTask(coverable))
    }
    )

    branch.AllModifiables.each(\modifiable -> tasks.add(new CheckModifiersTask(modifiable)))

    tasks.add(new CheckOfferingTask(branch))
    tasks.add(new CheckPolicyTermTask(branch))

    // Check answers on the PolicyPeriod, PolicyLines and PolicyLocations
    tasks.add(new CheckBranchAnswersTask(branch))
    branch.Lines.each(\line -> tasks.add(new CheckLineAnswersTask(line)))
    branch.PolicyLocations.each(\location -> tasks.add(new CheckLocationAnswersTask(location)))
    return tasks
  }

  private static function executeProductModelCheckTasks(branch: PolicyPeriod, pool: ForkJoinPool, tasks: List<CheckProductModelTask>): List<ProductModelSyncIssueWrapper> {
    var futures = tasks.map<ForkJoinTask>(\task: CheckProductModelTask -> {
      var profiledTask = Profiler.createPotentiallyProfiledCallable(
          PCProfilerTag.PARALLEL_PRODUCT_MODEL_SYNC,
          "ProductModelCheckThread "+task.Class.SimpleName+" for (" + task.BeanID.getType().RelativeName+":"+task.BeanID+")",
          task)
      return pool.submit(profiledTask)
    })
    var issues = new ArrayList<ProductModelSyncIssueWrapper>()
    JobProcessLogger.logInfo("Executing product model availability check tasks for job #${branch.Job.JobNumber}")
    pool.shutdown() // Pool will not accept new tasks but will finish the previously submitted tasks

    var shouldEnforceTimeout = ParallelProductModelSyncTimeoutPerCoverable >= 0
    if (shouldEnforceTimeout) {
      var waitTime = Math.max(ParallelProductModelSyncTimeoutPerCoverable, branch.AllCoverables.length * ParallelProductModelSyncTimeoutPerCoverable)
      var allTasksCompleted = pool.awaitTermination(waitTime, TimeUnit.MILLISECONDS)
      if (not allTasksCompleted) {
        throw new TimeoutException("Parallel product model sync timed out after ${waitTime} milliseconds")
      }
    }

    futures.each(\futureTask -> issues.addAll(futureTask.get() as List<ProductModelSyncIssueWrapper>))
    return issues
  }

  private static property get ParallelProductModelSyncTimeoutPerCoverable(): int {
    return PCConfigParameters.ParallelProductModelSyncTimeoutPerCoverable.Value
  }

  private static function getProductModelSyncIssuesForCoverable(coverable: Coverable, line: PolicyLine): List<ProductModelSyncIssueWrapper> {
    var issues = new ArrayList<ProductModelSyncIssueWrapper>()
    issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(coverable.checkCoveragesAgainstProductModelwLine(line)))
    issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(coverable.checkConditionsAgainstProductModelwLine(line)))
    issues.addAll(ProductModelSyncIssueWrapper.wrapIssues(coverable.checkExclusionsAgainstProductModelwLine(line)))
    return issues
  }

  private static function parallelizeProductModelSync(branch: PolicyPeriod): boolean {
    return (PCConfigParameters.ParallelizedProductModelSyncEnabled.Value
        and branch.shouldParallelizeProductModelAvailabilitySync())
  }

  private static function createForkJoinThreadPool(numThreads: int, originalBundle: Bundle): ForkJoinPool {
    final var namePrefix = "pmodelsync-pool-" + _threadPoolNumber.getAndIncrement() + "-thread-"
    final var threadNumber = new AtomicInteger(1)

    JobProcessLogger.logDebug("Creating thread pool: name=" + Thread.currentThread().getName() + ", threads=" + numThreads)
    var copiedBundle = createParallelProductModelSyncBundle(originalBundle)
    return new ForkJoinPool(numThreads, \pool -> {
      // Each thread should get its own copy of the bundle
      var threadBundle = createParallelProductModelSyncBundle(copiedBundle)
      return new ForkJoinProductModelSyncThread(pool, threadBundle, namePrefix + threadNumber.getAndIncrement())
    },
        null, // UncaughtExceptionHandler
        true) // async mode: true for FIFO, false for LIFO
  }

  private static function createParallelProductModelSyncBundle(originalBundle: Bundle): Bundle {
    var copiedBundle = new ParallelProductModelSyncBundle()
    copiedBundle.copy(originalBundle)
    return copiedBundle
  }

  //================================================================================
  // Helper Functions
  //================================================================================

  private static function getSliceDateAsString<E extends EffDatedBase>(originalBean: E): String {
    return (originalBean.Slice ? originalBean.SliceDate.ShortFormat : "N/A")
  }

  //================================================================================
  // Inner Classes
  //================================================================================

  /**
   * A {@link java.util.concurrent.Callable} class for checking a {@link Coverage) for product
   * model synchronization issues in parallel.
   */
  private static class CheckCoverableCoveragesTask extends CheckCoverableTask {

    construct(coverable: Coverable) {
      super(coverable)
    }

    function checkCoverable(coverable: Coverable): List<ProductModelSyncIssue> {
      return coverable.checkCoveragesAgainstProductModelwLine(coverable.PolicyLine)
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking a {@link PolicyCondition) for product
   * model synchronization issues in parallel.
   */
  private static class CheckCoverableConditionsTask extends CheckCoverableTask {

    construct(coverable: Coverable) {
      super(coverable)
    }

    override function checkCoverable(coverable: Coverable): List<ProductModelSyncIssue> {
      return coverable.checkConditionsAgainstProductModelwLine(coverable.PolicyLine)
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking an {@link Exclusion) for product
   * model synchronization issues in parallel.
   */
  private static class CheckCoverableExclusionsTask extends CheckCoverableTask {

    construct(coverable: Coverable) {
      super(coverable)
    }

    override function checkCoverable(coverable: Coverable): List<ProductModelSyncIssue> {
      return coverable.checkExclusionsAgainstProductModelwLine(coverable.PolicyLine)
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking a {@link Modifiable) for product
   * model synchronization issues in parallel.
   */
  private static class CheckModifiersTask extends CheckProductModelTask<Modifiable> {

    construct(modifiable: Modifiable) {
      super(modifiable)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      JobProcessLogger.logDebug("Checking modifiers: modifiable=" + SlicedRootBean.DisplayName +
          ", modifiable.Slice=" + SlicedRootBean.Slice +
          ", modifiable.SliceDate=" + getSliceDateAsString(SlicedRootBean))
      return ProductModelSyncIssueWrapper.wrapIssues(SlicedRootBean.checkModifiersAgainstProductModel())
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking {@link PolicyPeriod) question
   * answers for product model synchronization issues in parallel.
   */
  private static class CheckBranchAnswersTask extends CheckBranchTask {

    construct(branch: PolicyPeriod) {
      super(branch)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      JobProcessLogger.logDebug("Checking answers: branch=" + SlicedRootBean.DisplayName +
          ", branch.Slice=" + SlicedRootBean.Slice +
          ", branch.SliceDate=" + getSliceDateAsString(SlicedRootBean))
      return ProductModelSyncIssueWrapper.wrapIssues(SlicedRootBean.checkAnswersAgainstProductModel())
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking {@link PolicyPeriod) offerings for
   * product model synchronization issues in parallel.
   */
  private static class CheckOfferingTask extends CheckBranchTask {

    construct(branch: PolicyPeriod) {
      super(branch)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      JobProcessLogger.logDebug("Checking offering: branch=" + SlicedRootBean.DisplayName +
          ", branch.Slice=" + SlicedRootBean.Slice +
          ", branch.SliceDate=" + getSliceDateAsString(SlicedRootBean))
      return ProductModelSyncIssueWrapper.wrapIssues(SlicedRootBean.checkOfferingAgainstProductModel())
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking a {@link PolicyPeriod) term for
   * product model synchronization issues in parallel.
   */
  private static class CheckPolicyTermTask extends CheckBranchTask {

    construct(branch: PolicyPeriod) {
      super(branch)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      JobProcessLogger.logDebug("Checking policy term: branch=" + SlicedRootBean.DisplayName +
          ",branch.Slice=" + SlicedRootBean.Slice +
          ", branch.SliceDate=" + getSliceDateAsString(SlicedRootBean))
      return SlicedRootBean.checkPolicyTermAgainstProductModel()
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking {@link PolicyLine) question answers
   * for product model synchronization issues in parallel.
   */
  private static class CheckLineAnswersTask extends CheckProductModelTask<PolicyLine> {

    construct(line: PolicyLine) {
      super(line)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      JobProcessLogger.logDebug("Checking answers: line=" + SlicedRootBean.DisplayName +
          ", line.Slice=" + SlicedRootBean.Slice +
          ", line.SliceDate=" + getSliceDateAsString(SlicedRootBean))
      return ProductModelSyncIssueWrapper.wrapIssues(SlicedRootBean.checkAnswersAgainstProductModel())
    }
  }

  /**
   * A {@link java.util.concurrent.Callable} class for checking {@link PolicyLocation) question answers
   * for product model synchronization issues in parallel.
   */
  private static class CheckLocationAnswersTask extends CheckProductModelTask<PolicyLocation> {

    construct(location: PolicyLocation) {
      super(location)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      JobProcessLogger.logDebug("Checking answers: location=" + SlicedRootBean.DisplayName +
          ", location.Slice=" + SlicedRootBean.Slice +
          ", location.SliceDate=" + getSliceDateAsString(SlicedRootBean))
      return ProductModelSyncIssueWrapper.wrapIssues(SlicedRootBean.checkAnswersAgainstProductModel())
    }
  }

  /**
   * An abstract {@link java.util.concurrent.Callable} class for checking a {@link PolicyPeriod) for product
   * model synchronization issues in parallel.
   */
  private static abstract class CheckBranchTask extends CheckProductModelTask<PolicyPeriod> {

    construct(branch: PolicyPeriod) {
      super(branch)
    }
  }

  /**
   * An abstract {@link java.util.concurrent.Callable} class for checking a {@link Coverable) for product
   * model synchronization issues in parallel.
   */
  private static abstract class CheckCoverableTask extends CheckProductModelTask<Coverable> {

    construct(coverable : Coverable) {
      super(coverable)
    }

    override function executeTask(): List<ProductModelSyncIssueWrapper<ProductModelSyncIssue>> {
      var coverable = SlicedRootBean
      JobProcessLogger.logDebug("Checking coverable: coverable=" + coverable.DisplayName +
          ", coverable.Slice=" + coverable.Slice +
          ", coverable.SliceDate=" + getSliceDateAsString(coverable))
      return ProductModelSyncIssueWrapper.wrapIssues(checkCoverable(coverable))
    }

    abstract function checkCoverable(coverable: Coverable): List<ProductModelSyncIssue>
  }

  /**
   * An abstract {@link java.util.concurrent.Callable} class for checking for product model synchronization
   * issues in parallel.
   */
  private static abstract class CheckProductModelTask<E> implements Callable<List<ProductModelSyncIssueWrapper>> {
    var _threadBundle: ParallelProductModelSyncBundle
    final private var _rootBeanID : Key as readonly BeanID
    final private var _rootBeanSliceDate : Date
    private var _slicedThreadBundleBean : E

    construct(rootBean : EffDatedBase) {
      _rootBeanID = rootBean.ID
      if (rootBean.Slice) {
        _rootBeanSliceDate = rootBean.SliceDate
      } else {
        _rootBeanSliceDate = null
      }
    }

    property get SlicedRootBean(): E {
      if (_slicedThreadBundleBean == null) {
        //due to lazy initialization SlicedRootBean must be called only by the worker thread processing the task
        //otherwise we could end up initializing it from a bundle different from the thread bundle we're working with
        if (_threadBundle == null) {
          throw new IllegalStateException("Attempted to access root bean for parallel product model sync task before thread bundle initialization")
        }
        _slicedThreadBundleBean = _threadBundle.getEffDatedWithSliceDate(_rootBeanID, _rootBeanSliceDate) as E
      }
      return _slicedThreadBundleBean
    }

    override function call(): List<ProductModelSyncIssueWrapper> {
      var currThread = Thread.currentThread() as ForkJoinProductModelSyncThread
      // New thread has no security context. So create a new security token for each thread.
      final var origToken = PLDependencies.getCommonDependencies().getServiceToken()
      final var newToken = PLDependencies.getServiceTokenManager().createAuthenticatedToken(User.util.CurrentUser?.ID)
      _threadBundle = currThread.Bundle as ParallelProductModelSyncBundle
      setupTask()
      try {
        PLDependencies.getCommonDependencies().setServiceToken(newToken)
        ThreadLocalBundleProvider.set(_threadBundle)
        return executeTask()
      } finally {
        ThreadLocalBundleProvider.clear()
        PLDependencies.getCommonDependencies().setServiceToken(origToken)
        PLDependencies.getServiceTokenManager().removeToken(newToken)
      }
    }

    function setupTask() {
    }

    abstract function executeTask(): List<ProductModelSyncIssueWrapper>
  }

  static class ForkJoinProductModelSyncThread extends ForkJoinWorkerThread {
    final var _bundle: Bundle as readonly Bundle

    construct(pool: ForkJoinPool, bundle: Bundle, name: String) {
      super(pool)
      super.setName(name)
      _bundle = bundle
    }
  }

  /**
   * A bundle that does not allow {@link #commit()} and will throw an UnsupportedOperationException if commit is called.
   * <p>
   * ParallelProductModelSyncBundle was designed specifically for parallelization of the product model sync operation. During
   * parallelization, each child thread has its own ParallelProductModelSyncBundle and the beans from the main thread are copied
   * into it. This is necessary so that all threads view the same data during the sync operation.
   * <p>
   * This bundle is non-persistable as the parallelized product model sync checkBranchAgainstProductModel step should never modify the policy graph
   */
  private static class ParallelProductModelSyncBundle extends PCNeverPersistedBundle {

    /**
     * Get a copy from the original bean in this bundle and slice it according to the original bean slice date
     *
     * @param originalBeanKey ID of bean to get from bundle
     * @param originalBeanSliceDate SliceDate of original bean or null if in window mode
     * @return bean from bundle sliced according to the slice date received
     * @throws IllegalArgumentException if copy of original bean not found in the bundle
     */
    reified function getEffDatedWithSliceDate<E extends EffDatedBase>(originalBeanKey: Key, originalBeanSliceDate: Date): E {
      var threadBundleEffDated = this.getBeanInBundle(originalBeanKey) as E
      if (threadBundleEffDated == null) {
        throw new IllegalArgumentException("Failed to retrieve copy of bean "+originalBeanKey+" from parallel product model sync bundle")
      } else if (originalBeanSliceDate != null) {
        threadBundleEffDated = threadBundleEffDated.getSliceUntyped(originalBeanSliceDate) as E
      }
      return threadBundleEffDated
    }
  }
}