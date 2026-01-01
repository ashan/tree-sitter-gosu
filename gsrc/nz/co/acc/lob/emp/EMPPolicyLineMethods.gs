package nz.co.acc.lob.emp

uses java.math.RoundingMode
uses java.util.ArrayList
uses java.util.HashSet
uses java.util.Map
uses java.util.Set
uses java.math.BigDecimal
uses java.lang.Iterable

uses gw.api.policy.AbstractPolicyLineMethodsImpl
uses gw.api.productmodel.CoveragePattern
uses entity.windowed.EMPCostVersionList
uses gw.api.util.JurisdictionMappingUtil
uses gw.pl.persistence.core.Key
uses gw.validation.PCValidationContext
uses gw.policy.PolicyLineValidation
uses nz.co.acc.lob.emp.EMPLineValidation
uses gw.rating.worksheet.treenode.WorksheetTreeNodeUtil
uses gw.rating.worksheet.treenode.WorksheetTreeNodeContainer
uses gw.api.tree.RowTreeRootNode
uses nz.co.acc.lob.emp.financials.EMPQuoteDisplayUtil
uses gw.rating.AbstractRatingEngine
uses nz.co.acc.lob.emp.rating.EMPRatingEngine

@Export
class EMPPolicyLineMethods extends AbstractPolicyLineMethodsImpl {

  var _line: entity.EMPWPCLine

  construct(line: entity.EMPWPCLine) {
    super(line)
    _line = line
  }

  override property get CoveredStates(): Jurisdiction[] {
    var states = new HashSet<Jurisdiction>()
    if (_line.Branch.BaseState != null) {
      states.add(_line.Branch.BaseState)
    }
    for (n in _line.EMPWPCCovs) {
      states.add(n.EMPWPCLine.Branch.BaseState)
    }
    return states.toTypedArray()
  }

  override property get AllCoverables(): Coverable[] {
    var list: ArrayList<Coverable> = {_line}
    list.addAll(_line.EMPWPCCovs.toList())
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
    list.addAll(_line.EMPWPCCovs.toList())
    return list.toTypedArray()
  }

  /**
   * All costs across the term, in window mode.
   */
  override property get CostVLs(): Iterable<EMPCostVersionList> {
    return _line.VersionList.EMPCosts
  }

  override property get Transactions(): Set<Transaction> {
    var branch = _line.Branch
    return branch.getSlice(branch.PeriodStart).EMPTransactions.toSet()
  }

  override property get SupportsRatingOverrides(): boolean {
    return true
  }

  override function getAllCostsForCoverage(covered: Coverable, covPat: CoveragePattern): List<Cost> {
    return _line.Branch.AllCosts.where(\cost -> {
      return cost typeis EMPCost and
          cost.Coverage != null and
          cost.Coverage.Pattern.PublicID.equals(covPat.PublicID) and
          cost.Coverage.OwningCoverable == covered
    })
  }

  override function createPolicyLineValidation(validationContext: PCValidationContext): PolicyLineValidation<entity.EMPWPCLine> {
    return new EMPLineValidation(validationContext, _line)
  }

  override function createPolicyLineDiffHelper(reason: DiffReason, policyLine: PolicyLine): EMPDiffHelper {
    return new EMPDiffHelper(reason, this._line, policyLine as entity.EMPWPCLine)
  }

  override function initialize() {
    _line.AssociatedPolicyPeriod.PolicyTerm.ERStatus_ACC = ERStatus_ACC.TC_ER_MODIFIER_PENDING
    _line.addToEMPWPCCovs(_line.createAndAddEMPWPCCov())
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
    var util = new EMPQuoteDisplayUtil(_line, true)
    var cblsByType = util.getCoverablesWithCostsByType()
    var costsByCbl = util.getCostsByCoverable()
    var lineLevelCosts = costsByCbl.get(_line)

    // All but the line-level costs
    for (ctype in cblsByType.Keys.where(\t -> t != typeof(_line))) {
      var ctypeContainer = new WorksheetTreeNodeContainer(ctype.toString())
      ctypeContainer.ExpandByDefault = true
      treeNodes.add(ctypeContainer)
      for (cbl in cblsByType.get(ctype)) {
        var cblContainer = new WorksheetTreeNodeContainer(EMPQuoteDisplayUtil.CoverableDisplayName(cbl))
        cblContainer.ExpandByDefault = true
        ctypeContainer.addChild(cblContainer)
        for (c in costsByCbl.get(cbl)) {
          var costContainer = new WorksheetTreeNodeContainer(getCostDisplayName(c))
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
      var costContainer = new WorksheetTreeNodeContainer(EMPQuoteDisplayUtil.CostDisplayName(c))
      lineContainer.addChild(costContainer)
      costContainer.addChildren(WorksheetTreeNodeUtil.buildTreeNodes(c, showConditionals))
    }

    return WorksheetTreeNodeUtil.buildRootNode(treeNodes)
  }

  private function getCostDisplayName(cost:EMPCost) : String {
    return EMPQuoteDisplayUtil.CostCode(cost).HasContent ? EMPQuoteDisplayUtil.CostCode(cost) + " - " + EMPQuoteDisplayUtil.CostDisplayName(cost) : EMPQuoteDisplayUtil.CostDisplayName(cost)
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

  override function createRatingEngine(method: RateMethod, parameters: Map<RateEngineParameter, Object>): AbstractRatingEngine<EMPWPCLine> {
    return new EMPRatingEngine(_line as productmodel.EMPWPCLine, parameters[RateEngineParameter.TC_RATEBOOKSTATUS] as RateBookStatus)
  }

  override property get BaseStateRequired(): boolean {
    // Change this if you want to force a base state to be set for this line of business.
    return false
  }

  override property get Auditable() : boolean {
    return true
  }

  function allTotalLiableEarningsComponentsZero_ACC() : boolean {
    var zero = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
    var liableEarnings = _line.EMPWPCCovs.first().LiableEarningCov
    // null liable earnings returns true
    if (liableEarnings == null) {
      return true
    }
    return liableEarnings.TotalGrossEarnings_amt == zero and liableEarnings.TotalEarningsNotLiable_amt == zero
        and liableEarnings.TotalPAYE_amt == zero and liableEarnings.TotalExcessPaid_amt == zero
        and liableEarnings.PaymentToEmployees_amt == zero and liableEarnings.PaymentAfterFirstWeek_amt == zero
  }

  override property get LocationsInUseOnOrAfterSliceDate() : Set<Key> {
    return _line.Branch.OOSSlices.arrays("PolicyLocations").toArray(new PolicyLocation[0])*.FixedId.toSet()
  }
}