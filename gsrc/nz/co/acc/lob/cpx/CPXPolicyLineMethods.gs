package nz.co.acc.lob.cpx

uses java.util.ArrayList
uses java.util.HashSet
uses java.util.Map
uses java.util.Set
uses java.math.BigDecimal
uses java.lang.Iterable

uses gw.api.policy.AbstractPolicyLineMethodsImpl
uses gw.api.productmodel.CoveragePattern
uses entity.windowed.CPXCostVersionList
uses gw.api.util.JurisdictionMappingUtil
uses gw.pl.persistence.core.Key
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses nz.co.acc.lob.cpx.CPXLineValidation
uses gw.rating.worksheet.treenode.WorksheetTreeNodeUtil
uses gw.rating.worksheet.treenode.WorksheetTreeNodeContainer
uses gw.api.tree.RowTreeRootNode
uses nz.co.acc.lob.cpx.financials.CPXQuoteDisplayUtil
uses gw.rating.AbstractRatingEngine
uses nz.co.acc.lob.cpx.rating.CPXRatingEngine

@Export
class CPXPolicyLineMethods extends AbstractPolicyLineMethodsImpl {

  var _line: entity.INDCPXLine

  construct(line: entity.INDCPXLine) {
    super(line)
    _line = line
  }

  override property get CoveredStates(): Jurisdiction[] {
    var states = new HashSet<Jurisdiction>()
    if (_line.Branch.BaseState != null) {
      states.add(_line.Branch.BaseState)
    }
    for (n in _line.INDCPXCovs) {
      states.add(n.INDCPXLine.Branch.BaseState)
    }
    return states.toTypedArray()
  }

  override property get AllCoverables(): Coverable[] {
    var list: ArrayList<Coverable> = {_line}
    list.addAll(_line.INDCPXCovs.toList())
    return list.toTypedArray()
  }

  override property get AllCoverages(): Coverage[] {
    var list = new ArrayList<Coverage>()
    for (cb in AllCoverables) {
      list.addAll(cb.CoveragesFromCoverable.toList())
    }
    return list?.toTypedArray()
  }

  override property get AllExclusions(): Exclusion[] {
    var list: ArrayList<Exclusion>
    for (cb in AllCoverables) {
      list.addAll(cb.ExclusionsFromCoverable.toList())
    }
    return list.toTypedArray()
  }

  override property get AllConditions(): PolicyCondition[] {
    var list: ArrayList<PolicyCondition>
    for (cb in AllCoverables) {
      list.addAll(cb.ConditionsFromCoverable.toList())
    }
    return list.toTypedArray()
  }

  override property get AllModifiables(): Modifiable[] {
    var list: ArrayList<Modifiable> = {_line}
    list.addAll(_line.INDCPXCovs.toList())
    return list.toTypedArray()
  }

  /**
   * All costs across the term, in window mode.
   */
  override property get CostVLs(): Iterable<CPXCostVersionList> {
    return _line.VersionList.CPXCosts
  }

  override property get Transactions(): Set<Transaction> {
    var branch = _line.Branch
    return branch.getSlice(branch.PeriodStart).CPXTransactions.toSet()
  }

  override property get SupportsRatingOverrides(): boolean {
    return true
  }

  override function getAllCostsForCoverage(covered: Coverable, covPat: CoveragePattern): List<Cost> {
    return _line.Branch.AllCosts.where(\cost -> {
      return cost typeis CPXCost and
          cost.Coverage != null and
          cost.Coverage.Pattern.PublicID.equals(covPat.PublicID) and
          cost.Coverage.OwningCoverable == covered
    })
  }

  override function createPolicyLineValidation(validationContext: PCValidationContext): PolicyLineValidation<entity.INDCPXLine> {
    return new CPXLineValidation(validationContext, _line)
  }

  override function createPolicyLineDiffHelper(reason: DiffReason, policyLine: PolicyLine): CPXDiffHelper {
    return new CPXDiffHelper(reason, this._line, policyLine as entity.INDCPXLine)
  }

  override function initialize() {
    var cpxCov = _line.createAndAddINDCPXCov()
    var cpxInfoCov = new CPXInfoCov_ACC(_line.Branch)
    cpxInfoCov.PeriodEnd = _line.ExpirationDate
    cpxInfoCov.PeriodStart = _line.EffectiveDate
    cpxCov.addToCPXInfoCovs(cpxInfoCov)
    _line.addToINDCPXCovs(cpxCov)
    _line.syncModifiers()
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
    var util = new CPXQuoteDisplayUtil(_line, true)
    var cblsByType = util.getCoverablesWithCostsByType()
    var costsByCbl = util.getCostsByCoverable()
    var lineLevelCosts = costsByCbl.get(_line)

    // All but the line-level costs
    for (ctype in cblsByType.Keys.where(\t -> t != typeof(_line))) {
      var ctypeContainer = new WorksheetTreeNodeContainer(ctype.toString())
      ctypeContainer.ExpandByDefault = true
      treeNodes.add(ctypeContainer)
      for (cbl in cblsByType.get(ctype)) {
        var cblContainer = new WorksheetTreeNodeContainer(CPXQuoteDisplayUtil.CoverableDisplayName(cbl))
        cblContainer.ExpandByDefault = true
        ctypeContainer.addChild(cblContainer)
        for (c in costsByCbl.get(cbl)) {
          var costContainer = new WorksheetTreeNodeContainer(CPXQuoteDisplayUtil.CostDisplayName(c))
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
      var costContainer = new WorksheetTreeNodeContainer(CPXQuoteDisplayUtil.CostDisplayName(c))
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

  override function createRatingEngine(method: RateMethod, parameters: Map<RateEngineParameter, Object>): AbstractRatingEngine<INDCPXLine> {
    return new CPXRatingEngine(_line as productmodel.INDCPXLine, parameters[RateEngineParameter.TC_RATEBOOKSTATUS] as RateBookStatus)
  }

  override property get BaseStateRequired(): boolean {
    // Change this if you want to force a base state to be set for this line of business.
    return false
  }

  override function allTotalLiableEarningsComponentsZero_ACC() : boolean {
    // Assume that CPX policies always have activity
    return false
  }

  override property get LocationsInUseOnOrAfterSliceDate() : Set<Key> {
    return _line.Branch.OOSSlices.arrays("PolicyLocations").toArray(new PolicyLocation[0])*.FixedId.toSet()
  }
}