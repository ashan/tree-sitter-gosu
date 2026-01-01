package gw.apd

uses entity.windowed.APDCostVersionList
uses gw.apd.financials.APDQuoteDisplayUtil
uses gw.apd.rating.APDRatingEngine
uses gw.api.policy.AbstractPolicyLineMethodsImpl
uses gw.api.productmodel.CoveragePattern
uses gw.api.tree.RowTreeRootNode
uses gw.api.util.JurisdictionMappingUtil
uses gw.pl.persistence.core.Key
uses gw.policy.PolicyLineValidation
uses gw.rating.AbstractRatingEngine
uses gw.rating.worksheet.treenode.WorksheetTreeNodeContainer
uses gw.rating.worksheet.treenode.WorksheetTreeNodeUtil
uses gw.validation.PCValidationContext

uses java.math.BigDecimal

uses entity.APDCost
uses entity.PolicyLine

@Export
class APDPolicyLineMethods extends AbstractPolicyLineMethodsImpl {

  var _line: entity.APDManualPolicyLine

  construct(line: entity.APDManualPolicyLine) {
    super(line)
    _line = line
  }

  override property get CoveredStates(): Jurisdiction[] {
    var states = new HashSet<Jurisdiction>()
    if (_line.Branch.BaseState != null) {
      states.add(_line.Branch.BaseState)
    }
    return states.toTypedArray()
  }

  override property get AllCoverables(): Coverable[] {
    return _line.RiskCoverables
  }

  override property get AllCoverages(): Coverage[] {
    var list = new ArrayList<Coverage>()
    for (cb in AllCoverables) {
      list.addAll(cb.CoveragesFromCoverable.toList())
    }
    return list?.toTypedArray()
  }

  override property get AllExclusions(): Exclusion[] {
    var list = new ArrayList<Exclusion>()
    for (cb in AllCoverables) {
      list.addAll(cb.ExclusionsFromCoverable.toList())
    }
    return list?.toTypedArray()
  }

  override property get AllConditions(): PolicyCondition[] {
    var list = new ArrayList<PolicyCondition>()
    for (cb in AllCoverables) {
      list.addAll(cb.ConditionsFromCoverable.toList())
    }
    return list?.toTypedArray()
  }

  override property get AllModifiables(): Modifiable[] {
    var list: ArrayList<Modifiable> = {}
    return list.toTypedArray()
  }

  /**
   * All costs across the term, in window mode.
   */
  override property get CostVLs(): Iterable<APDCostVersionList> {
    return _line.VersionList.APDCosts
  }

  override property get Transactions(): Set<Transaction> {
    var branch = _line.Branch
    return branch.getSlice(branch.PeriodStart).APDTransactions.toSet()
  }

  override property get SupportsRatingOverrides(): boolean {
    return true
  }

  override function getAllCostsForCoverage(covered: Coverable, covPat: CoveragePattern): List<Cost> {
    return _line.Branch.AllCosts.where(\cost -> {
      return cost typeis APDCost and
          cost.Coverage != null and
          cost.Coverage.Pattern == covPat and
          cost.Coverage.OwningCoverable == covered
    })
  }

  override function createPolicyLineValidation(validationContext: PCValidationContext): PolicyLineValidation<entity.APDManualPolicyLine> {
    return new APDLineValidation(validationContext, _line)
  }

  override function createPolicyLineDiffHelper(reason: DiffReason, policyLine: PolicyLine): APDDiffHelper {
    return new APDDiffHelper(reason, this._line, policyLine as entity.APDManualPolicyLine)
  }

  override function initialize() {
    // default the base jurisdiction if not set
    if (_line.Branch.BaseState == null) {
      _line.Branch.BaseState = JurisdictionMappingUtil.getJurisdiction(_line.Branch.PrimaryLocation)
    }
  }

  override function cloneAutoNumberSequences() {
    _line.RiskCoverables.where(\rc -> rc.Coverable.AutoNumber)*.cloneChildRiskObjectSequenceNumber()
  }

  override function resetAutoNumberSequences() {
    _line.RiskCoverables.where(\rc -> rc.Coverable.AutoNumber)*.resetChildRiskObjectSequenceNumber()
  }

  override function bindAutoNumberSequences() {
    _line.RiskCoverables.where(\rc -> rc.Coverable.AutoNumber)*.bindChildRiskObjectSequenceNumber()
  }

  override function renumberAutoNumberSequences() {
    _line.RiskCoverables.where(\rc -> rc.Coverable.AutoNumber)*.renumberNewRiskObjectSequenceNumber()
  }

  override function getWorksheetRootNode(showConditionals: boolean): RowTreeRootNode {
    var treeNodes: List<WorksheetTreeNodeContainer> = {}
    var util = new APDQuoteDisplayUtil(_line, true)
    var cblsByType = util.CoverablesWithCostsByType
    var costsByCbl = util.CostsByCoverable
    var lineLevelCosts = costsByCbl.get(_line)

    // All but the line-level costs
    for (ctype in cblsByType.Keys.where(\t -> t != typeof(_line))) {
      var ctypeContainer = new WorksheetTreeNodeContainer(ctype.toString())
      ctypeContainer.ExpandByDefault = true
      treeNodes.add(ctypeContainer)
      for (cbl in cblsByType.get(ctype)) {
        var cblContainer = new WorksheetTreeNodeContainer(APDQuoteDisplayUtil.CoverableDisplayName(cbl))
        cblContainer.ExpandByDefault = true
        ctypeContainer.addChild(cblContainer)
        for (c in costsByCbl.get(cbl)) {
          var costContainer = new WorksheetTreeNodeContainer(APDQuoteDisplayUtil.CostDisplayName(c))
          cblContainer.addChild(costContainer)
          costContainer.addChildren(WorksheetTreeNodeUtil.buildTreeNodes(c, showConditionals))
        }
      }
    }

    // Line-level costs
    var lineContainer = new WorksheetTreeNodeContainer("Line-level")
    lineContainer.ExpandByDefault = true
    treeNodes.add(lineContainer)
    for (c in lineLevelCosts) {
      var costContainer = new WorksheetTreeNodeContainer(APDQuoteDisplayUtil.CostDisplayName(c))
      lineContainer.addChild(costContainer)
      costContainer.addChildren(WorksheetTreeNodeUtil.buildTreeNodes(c, showConditionals))
    }

    return WorksheetTreeNodeUtil.buildRootNode(treeNodes)
  }

  /***
   * This function decides whether to allow a location to be removed in the UI.
   * This default implementation is provided simply as a reminder that you are likely to want to override default behavior here, too.
   */
  override function canSafelyDeleteLocation(location: PolicyLocation): String {
    var notSafeReason = super.canSafelyDeleteLocation(location)

    if (notSafeReason.equalsIgnoreCase("")) {
      // Put line-specific reasons why a location cannot safely be deleted here.
    }

    return notSafeReason
  }

  override function doGetTIVForCoverage(cov: Coverage): BigDecimal {
    switch (cov.FixedId.Type) {
      // Enter case statements for each type of coverage here
    }
    return BigDecimal.ZERO
  }

  override function createRatingEngine(method: RateMethod, parameters: Map<RateEngineParameter, Object>): AbstractRatingEngine<APDManualPolicyLine> {
    return new APDRatingEngine(_line as productmodel.ManualLine, parameters[RateEngineParameter.TC_RATEBOOKSTATUS] as RateBookStatus)
  }

  override property get BaseStateRequired(): boolean {
    // Change this if you want to force a base state to be set for this line of business.
    return true
  }

  override property get SupportsNonSpecificLocations() : boolean {
    return true
  }

  override property get UnusedLocationCleanupEnabled() : boolean {
    return false
  }

  /***
   * Used by unused location cleanup only which is disabled by the UnusedLocationCleanupEnabled property above. It is difficult
   * to return all locations in use by a manual line due to their dynamic nature.
   */
  override property get LocationsInUseOnOrAfterSliceDate() : Set<Key> {
    throw "Not implemented"
  }

  override function usesAllOOSSliceDates() : boolean {
    // Returns false if the product has any splittable fields, true otherwise
    var product = _line.Branch.Policy.APDProduct
    return (product == null) or (!product.ContainsSplittableAttribute)
  }

  override property get APDLine() : boolean {
    return true
  }
}