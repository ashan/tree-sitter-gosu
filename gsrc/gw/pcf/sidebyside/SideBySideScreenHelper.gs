package gw.pcf.sidebyside

uses gw.api.productmodel.CovTermPattern
uses gw.api.productmodel.CovTermPatternLookup
uses gw.api.productmodel.CoveragePattern
uses gw.api.productmodel.PolicyLinePattern
uses gw.api.upgrade.PCCoercions
uses gw.api.web.job.JobWizardHelper
uses gw.job.sxs.SideBySideCovTermInfo
uses gw.job.sxs.SideBySideCoverageInfo
uses gw.job.sxs.SideBySideCoverageRow
uses gw.job.sxs.SideBySideCoverageSet
uses gw.job.sxs.SideBySidePolicyPeriodInfo
uses gw.job.sxs.SideBySideVehicleSet
uses gw.lob.common.SideBySideUtil
uses gw.util.IOrderedList
uses gw.util.Pair
uses gw.util.concurrent.LockingLazyVar

@Export
class SideBySideScreenHelper {

  private var _jobWizardHelper     : JobWizardHelper
  private var _policyPeriodInfos   : SideBySidePolicyPeriodInfo[] as PeriodInfos
  private var _validationLevel     : ValidationLevel

  private var _lineCoverageSets    : SideBySideCoverageSet[] as LineCoverageSets
  private var _vehicleCoverageSets : SideBySideVehicleSet[] as PAVehicleSets

  var _errorsMap : Map<SideBySidePolicyPeriodInfo, String> as ErrorsMap

  private static final var ALWAYS_POST_ON_CHANGES_TERMS = {CovTermPatternLookup.getByPublicID("PALiability")}
  private var _cache : SideBySideScreenCache

  private static final var paLineCovPatterns = new LockingLazyVar<IOrderedList<CoveragePattern>>()  {
    override function init() : IOrderedList<CoveragePattern> {
      return (PCCoercions.makeProductModel<PolicyLinePattern>("PersonalAutoLine")).getCoverageCategoryByPublicId("PAPLiabGrp")
        .coveragePatternsForEntity(PersonalAutoLine)
        .orderBy(\coveragePattern -> coveragePattern.Priority)
        .thenBy(\coveragePattern -> coveragePattern.PublicID)
    }
  }

  private static final var paVehicleCovPatterns = new LockingLazyVar<IOrderedList<CoveragePattern>>()  {
    override function init() : IOrderedList<CoveragePattern> {
      return (PCCoercions.makeProductModel<PolicyLinePattern>("PersonalAutoLine")).getCoverageCategoryByPublicId("PAPPhysDamGrp")
          .coveragePatternsForEntity(PersonalVehicle)
          .orderBy(\coveragePattern -> coveragePattern.PublicID)
          .thenBy(\coveragePattern -> coveragePattern.Priority)
    }
  }

  construct(jobWizHelper : JobWizardHelper, periods : PolicyPeriod[], cache : SideBySideScreenCache = null) {
    // If the server is in dev mode, make sure we clear the coverage pattern
    // local caches.
/*
   TODO - see if product model reload is even going to be supported in 8.0
    if (PLDependenciesGateway.ServerMode.isDev()) {
      // Clear the cached cov patterns if the product model is reloaded
      TypeSystem.addTypeLoaderListenerAsWeakRef(new ProductModelTypeLoader() {
        override function refreshed() {
          if (paLineCovPatterns != null) {
            paLineCovPatterns.clear()
            paVehicleCovPatterns.clear()
          }
        }
        override function refreshedTypes(types : RefreshRequest) {
          paLineCovPatterns.clear()
          paVehicleCovPatterns.clear()
        }
      })
    }
*/
    _cache = cache ?: new SideBySideScreenCache()
    _jobWizardHelper = jobWizHelper
    _validationLevel = periods.first().ValidationLevel

    _policyPeriodInfos = new SideBySidePolicyPeriodInfo[periods.length]
    periods.eachWithIndex(\period, colIdx -> {
      _policyPeriodInfos[colIdx] = new gw.job.sxs.SideBySidePolicyPeriodInfo(period, colIdx, _validationLevel, jobWizHelper, _cache)
    })

    initLineCoverageSets()

    initVehicleCoverageSets()

    // -- Errors/Warnings -- //
    _errorsMap = PeriodInfos.mapToValue(\ periodInfo -> periodInfo.ErrorText)
  }

  private function initLineCoverageSets() {
    var paLineCoveragePatterns = paLineCovPatterns.get()

    var lineCoverableMap = _policyPeriodInfos.mapToValue(\periodInfo -> periodInfo.Period.PersonalAutoLine)

    var lineCoveragePatterns = paLineCoveragePatterns
        .where(\c -> lineCoverableMap.Values.hasMatch(\p -> isCovAvail(c, p)))
        .toTypedArray()

    var covSets = createCoverageSets(lineCoveragePatterns, lineCoverableMap)
    LineCoverageSets = covSets.toTypedArray()
  }

  private function isCovAvail(covPattern : CoveragePattern, coverable : Coverable) : boolean {
    return _cache.CovAvail.computeIfAbsent(Pair.make(covPattern, coverable),
        \k -> coverable.isCoverageSelectedOrAvailable(covPattern))
  }

  private function initVehicleCoverageSets() {
    var paVehCoveragePatterns = paVehicleCovPatterns.get()

    var listOfVehicleMaps = gw.lob.common.SideBySideUtil.buildListOfVehicleMaps(_policyPeriodInfos)

    var vehicleSets : List<SideBySideVehicleSet> = {}
    listOfVehicleMaps.each(\vehMap -> {
      var vehCovSets = createCoverageSets(paVehCoveragePatterns?.toTypedArray(), vehMap)
      var vehSet = new SideBySideVehicleSet(_policyPeriodInfos, vehMap, vehCovSets?.toTypedArray())
      vehicleSets.add(vehSet)
    })
    _vehicleCoverageSets = vehicleSets.toTypedArray()
  }

  private function getCoverageLabel(covPattern : CoveragePattern) : String{
    return SideBySideUtil.getDisplayValue(covPattern.CoverageCategory.PolicyLinePattern, covPattern)
  }

  private function getCovTermLabel(covTermInfo : SideBySideCovTermInfo) : String {
    var covTermDispLabel = SideBySideUtil.getDisplayValue(covTermInfo.CovInfo.CoveragePattern.CoverageCategory.PolicyLinePattern,
                                                          covTermInfo.CovTermPattern)
    return "    " + covTermDispLabel // TODO: Use another disp key for indentation?
  }

  private function getCovInfoToCovTermInfoMap(covInfos : SideBySideCoverageInfo[]) : Map <SideBySideCoverageInfo, SideBySideCovTermInfo[]> {
    var covInfoToCovTermInfoMap = new HashMap <SideBySideCoverageInfo, SideBySideCovTermInfo[]>()
    covInfos.each(\ci -> {
      var covTermPatterns =
          ci.CoveragePattern.CovTerms.where(\ctp -> covInfos.hasMatch(\cInfo -> cInfo.Coverable != null and
              isCovTermAvailable(ctp, cInfo.Coverable)))
              .sortBy(\covTerm -> covTerm.Priority)
      var sxsCovTermInfos = SideBySideUtil.buildCovTermInfoList(ci, covTermPatterns, ALWAYS_POST_ON_CHANGES_TERMS)
      if (sxsCovTermInfos.Count > 0) {
        covInfoToCovTermInfoMap.put(ci, sxsCovTermInfos.toTypedArray())
      } else {
        covInfoToCovTermInfoMap.put(ci, {})
      }
    })
    return covInfoToCovTermInfoMap
  }

  private function isCovTermAvailable(covTermPattern : CovTermPattern, coverable : Coverable) : boolean {
    return _cache.CovTermAvail.computeIfAbsent(Pair.make(covTermPattern, coverable),
        \k -> coverable.isCovTermAvailable(covTermPattern))
  }

  private function getMaxNumCovTerms(covTermInfos : Collection<SideBySideCovTermInfo[]>) : int {
    return covTermInfos?.map(\array -> array.length)?.max()
  }

  private function createCoverageSets(covPatterns : CoveragePattern [],
                                      coverableMap : Map<SideBySidePolicyPeriodInfo, Coverable>)
      : List<SideBySideCoverageSet>
  {
    var covSets : List<SideBySideCoverageSet> = {}
    covPatterns.each(\covPattern -> {
      // Represents coverage rows in the Side-By-Side Screen
      var covRows : List<SideBySideCoverageRow> = {}
      var idxToCovTermInfoMap : HashMap<Integer,SideBySideCovTermInfo[]> = {}

      var sxsCovInfos =
          PeriodInfos.map(\periodInfo ->
              new SideBySideCoverageInfo(periodInfo, coverableMap.get(periodInfo),covPattern, _cache))

      var covInfoToCovTermInfoMap = getCovInfoToCovTermInfoMap(sxsCovInfos)
      var maxNumCovTermInfos = getMaxNumCovTerms(covInfoToCovTermInfoMap.Values)

      var idx = 0
      for (idx..|maxNumCovTermInfos) {
        var covTermInfoList : List<SideBySideCovTermInfo> = {}
        sxsCovInfos.each(\covInfo -> {
          var covTermInfos = covInfoToCovTermInfoMap.get(covInfo)
          var targetCovTerm : SideBySideCovTermInfo
          if (covTermInfos.length == 0 or idx > covTermInfos.length) {
            targetCovTerm = new SideBySideCovTermInfo(covInfo, null)
          } else {
            targetCovTerm = covTermInfos[idx]
          }
          covTermInfoList.add(targetCovTerm)
        })
        idxToCovTermInfoMap.put(idx, covTermInfoList.toTypedArray())
        idx++
      }

      if (maxNumCovTermInfos > 1 or maxNumCovTermInfos == 0) {
        var dummyCovTermInfos = sxsCovInfos.map(\covInfo -> new SideBySideCovTermInfo(covInfo, null))
        covRows.add(new SideBySideCoverageRow(getCoverageLabel(covPattern), dummyCovTermInfos))
      }

      idx = 0
      for (idx..|maxNumCovTermInfos) {
        var label : String
        var covTermInfo = idxToCovTermInfoMap.get(idx).first()
        if (idx == 0 and maxNumCovTermInfos == 1) {
          label = getCoverageLabel(covTermInfo.CovInfo.CoveragePattern)
        } else {
          label = getCovTermLabel(covTermInfo)
        }
        covRows.add(new SideBySideCoverageRow(label, idxToCovTermInfoMap.get(idx)))
        idx++
      }
      if (covRows.size() > 0) {
        covSets.add(new SideBySideCoverageSet(covRows.toTypedArray(), idxToCovTermInfoMap))
      }
    })
    return covSets.toTypedArray()?.toList()
  }
}