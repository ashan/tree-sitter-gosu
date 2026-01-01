package nz.co.acc.lob.aep

uses java.util.HashSet
uses java.util.Map
uses java.util.Set
uses java.math.BigDecimal
uses java.lang.Iterable

uses gw.api.policy.AbstractPolicyLineMethodsImpl
uses gw.api.productmodel.CoveragePattern
uses entity.windowed.AEPCost_ACCVersionList
uses gw.pl.persistence.core.Key
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses gw.rating.worksheet.treenode.WorksheetTreeNodeUtil
uses gw.rating.worksheet.treenode.WorksheetTreeNodeContainer
uses gw.api.tree.RowTreeRootNode
uses nz.co.acc.lob.aep.financials.AEPQuoteDisplayUtil
uses gw.rating.AbstractRatingEngine
uses nz.co.acc.lob.aep.rating.AEPRatingEngine

@Export
class AEPPolicyLineMethods extends AbstractPolicyLineMethodsImpl {

  var _line: entity.AEPLine_ACC

  construct(line: entity.AEPLine_ACC) {
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
    return new Coverable[]{_line}
  }

  override property get AllCoverages(): Coverage[] {
    return new Coverage[]{}
  }

  override property get AllExclusions(): Exclusion[] {
    return new Exclusion[]{}
  }

  override property get AllConditions(): PolicyCondition[] {
    return new PolicyCondition[]{}
  }

  override property get AllModifiables(): Modifiable[] {
    return new Modifiable[]{_line}
  }

  /**
   * All costs across the term, in window mode.
   */
  override property get CostVLs(): Iterable<AEPCost_ACCVersionList> {
    return _line.VersionList.AEPCosts
  }

  override property get Transactions(): Set<Transaction> {
    var branch = _line.Branch
    return branch.getSlice(branch.PeriodStart).AEPTransactions.toSet()
  }

  override property get SupportsRatingOverrides(): boolean {
    return true
  }

  override function getAllCostsForCoverage(covered: Coverable, covPat: CoveragePattern): List<Cost> {
    return _line.Branch.AllCosts.where(\cost ->  cost typeis AEPCost_ACC and
                                                 cost.Coverage != null and
                                                 cost.Coverage.Pattern.PublicID == covPat.PublicID and
                                                 cost.Coverage.OwningCoverable == covered
    )
  }

  override function createPolicyLineValidation(validationContext: PCValidationContext): PolicyLineValidation<entity.AEPLine_ACC> {
    return new AEPLineValidation(validationContext, _line)
  }

  override function createPolicyLineDiffHelper(reason: DiffReason, policyLine: PolicyLine): AEPDiffHelper {
    return new AEPDiffHelper(reason, this._line, policyLine as entity.AEPLine_ACC)
  }

  override function initialize() {
  }

  override function resetAutoNumberSequences() {
    renumberAllAutoSequences()
  }

  override function cloneAutoNumberSequences() {
  }

  override function bindAutoNumberSequences() {
    renumberAllAutoSequences()
  }

  override function renumberAutoNumberSequences() {
  }

  private function renumberAllAutoSequences() {
  }

  override function getWorksheetRootNode(showConditionals: boolean): RowTreeRootNode {
    var treeNodes: List<WorksheetTreeNodeContainer> = {}
    var util = new AEPQuoteDisplayUtil(_line, true)
    var cblsByType = util.getCoverablesWithCostsByType()
    var costsByCbl = util.getCostsByCoverable()
    var lineLevelCosts = costsByCbl.get(_line)

    // All but the line-level costs
    for (ctype in cblsByType.Keys.where(\t -> t != typeof(_line))) {
      var ctypeContainer = new WorksheetTreeNodeContainer(ctype.toString())
      ctypeContainer.ExpandByDefault = true
      treeNodes.add(ctypeContainer)
      for (cbl in cblsByType.get(ctype)) {
        var cblContainer = new WorksheetTreeNodeContainer(AEPQuoteDisplayUtil.CoverableDisplayName(cbl))
        cblContainer.ExpandByDefault = true
        ctypeContainer.addChild(cblContainer)
        for (c in costsByCbl.get(cbl)) {
          var costContainer = new WorksheetTreeNodeContainer(AEPQuoteDisplayUtil.CostDisplayName(c))
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
      var costContainer = new WorksheetTreeNodeContainer(AEPQuoteDisplayUtil.CostDisplayName(c))
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

  override function createRatingEngine(method: RateMethod, parameters: Map<RateEngineParameter, Object>): AbstractRatingEngine<AEPLine_ACC> {
    return new AEPRatingEngine(_line as productmodel.AEPLine, parameters[RateEngineParameter.TC_RATEBOOKSTATUS] as RateBookStatus)
  }

  override property get BaseStateRequired(): boolean {
    // Change this if you want to force a base state to be set for this line of business.
    return false
  }

  override property get Auditable() : boolean {
    return true
  }

  override property get LocationsInUseOnOrAfterSliceDate() : Set<Key> {
    return _line.Branch.OOSSlices.arrays("PolicyLocations").toArray(new PolicyLocation[0])*.FixedId.toSet()
  }
}