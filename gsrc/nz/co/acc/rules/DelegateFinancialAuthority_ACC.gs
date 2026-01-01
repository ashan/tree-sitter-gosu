package nz.co.acc.rules

uses entity.*
uses gw.pl.currency.MonetaryAmount
uses gw.rating.rtm.query.GSTUtil_ACC

uses java.math.BigDecimal

/**
 * Created by andy on 12/04/2017.
 * Inner class that is called from the rules page
 */
class DelegateFinancialAuthority_ACC {

  private var period_ACC : PolicyPeriod

  private var canAutoIssuePolicyChange = true   // Master flag

  private var bicCodeChanged = false
  private var liableEarningsChanges = false
  private var bicPercentageChanged = false
  private var cpxAddedRemoved = false
  private var renumerationChanged = false
  private var isAudit = false

  private var policyChangeAmount : MonetaryAmount as PolicyChangeAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)

  // DE1404 - Only create a DFA if the policy change amount exists and is not $0.00
  public property get PolicyChangeAmountValid() : boolean {
    return this.policyChangeAmount != null and this.policyChangeAmount != new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
  }

  construct() {}

  construct(period : PolicyPeriod) {
    this.period_ACC = period

    // Set flag if this is audit driving this run.
    isAudit = period.Audit != null

    createChangeAmountWithGST_ACC()
  }


  /**
   * main method to get band
   * @return
   */
  public function canAutoIssueWithoutDfa_ACC() : boolean {


    period_ACC.Lines.each(\line -> {
      var autoIssue = false

      switch (typeof line) {
        case (productmodel.EMPWPCLine):
          autoIssue = processWPCLine_ACC(line)
          break
        case (productmodel.CWPSLine):
          autoIssue = processWPSLine_ACC(line)
          break
        case (productmodel.INDCoPLine):
          autoIssue = processCPLine_ACC(line)
          break
        case (productmodel.INDCPXLine):
          autoIssue = processCPXLine_ACC(line)
          break
      }

      // Turn canAutoIssuePolicyChange to TRUE only if there is one
      if (!autoIssue) {
        canAutoIssuePolicyChange = false
      }

    })

    if(this.isAudit and this.period_ACC.Job.TriggerReason_ACC == ReasonCode.TC_IR_ACC){
      return  true
    }

    return canAutoIssuePolicyChange
  }

  /**
   * Process this WPS Line to see if it needs to be assessed with DFA
   */
  public function processWPSLine_ACC(line : PolicyLine) : boolean {

    if (!isAudit) {
      // If only LE or Modifiers changed then auto issue
      if (hasLiableEarningsChanged_ACC(line) or hasModifiersChanged(line)) {

        // Can issue if only the bic codes have changed
        bicCodeChanged = hasBicCodeChanged_ACC(line)
        bicPercentageChanged = hasBicPercentageChanged_ACC(line)

        // Commenting out as may need this again in the very near future
        //renumerationChanged = hasRenumerationChanged_ACC(line)

        if (!bicCodeChanged and
            !bicPercentageChanged and
            !renumerationChanged) {
          return true
        }
      }
    }

    // Default is false auto issue
    return false
  }

  /**
   * Process this WPC Line to see if it needs to be assessed with DFA
   */
  public function processWPCLine_ACC(line : PolicyLine) : boolean {

    if (!isAudit) {
      // If only LE or Modifiers changed then auto issue
      if (hasLiableEarningsChanged_ACC(line) or hasModifiersChanged(line)) {

        // Can issue if only the bic codes have changed
        bicCodeChanged = hasBicCodeChanged_ACC(line)
        bicPercentageChanged = hasBicPercentageChanged_ACC(line)

        if (!bicCodeChanged and
            !bicPercentageChanged) {
          return true
        }
      }
    }

    // Default is false auto issue
    return false
  }

  /**
   * Process this CP Line to see if it needs to be assessed with DFA
   */
  public function processCPLine_ACC(line : PolicyLine) : boolean {

    // DE2395 - if the previous term is ceased then auto approve
    if (isPreviousTermCeased(line)) {
      return true
    }

    // If only Modifiers changed then auto issue
    if (hasModifiersChanged(line) ) {

      // Can issue if only the bic codes have changed
      bicCodeChanged = hasBicCodeChanged_ACC(line)
      bicPercentageChanged = hasBicPercentageChanged_ACC(line)

      // Has CPX been added or removed
      cpxAddedRemoved = hasCPXBeenAddedOrRemoved_ACC(line, true)

      // If Le has changed then perform the DFA Rules test
      liableEarningsChanges = hasLiableEarningsChanged_ACC(line)

      if (!bicCodeChanged and
          !bicPercentageChanged and
          !cpxAddedRemoved and
          !liableEarningsChanges) {
        return true
      }
    }

    // Default is false auto issue
    return false

  }

  /**
   * Process this CPX Line to see if it needs to be assessed with DFA
   */
  public function processCPXLine_ACC(line : PolicyLine) : boolean  {

    // If only Modifiers changed then auto issue
    if (hasModifiersChanged(line) ) {

      // Can issue if only the bic codes have changed
      bicCodeChanged = hasBicCodeChanged_ACC(line)
      bicPercentageChanged = hasBicPercentageChanged_ACC(line)

      // Has CPX been added or removed
      cpxAddedRemoved = hasCPXBeenAddedOrRemoved_ACC(line, false)

      if (!bicCodeChanged and
          !bicPercentageChanged and
          !cpxAddedRemoved) {
        return true
      }
    }

    // Default is false auto issue
    return false

  }

  private function isPreviousTermCeased(line : PolicyLine) : boolean {
    // Find the previous term
    var lastYearsLevyYear = line.AssociatedPolicyPeriod.LevyYear_ACC - 1
    var lastYearsPolicyPeriod = line.AssociatedPolicyPeriod.Policy.CompletedPeriodsWithCost.orderByDescending(\row -> row.CreateTime).firstWhere(\elt -> elt.LevyYear_ACC == lastYearsLevyYear)
    if (lastYearsPolicyPeriod != null) {
      return lastYearsPolicyPeriod.PolicyTerm.CeasedTrading_ACC
    }
    return false
  }


  /**
   * Has the Modifiers Changed
   * @return boolean
   */
  public function hasModifiersChanged(line : PolicyLine): boolean {

    switch (typeof line) {
      case (productmodel.EMPWPCLine):
        var l = line as EMPWPCLine
        if (l.BasedOn.getEMPLineModifiers().length != l.getEMPLineModifiers().length) {
          return true
        }
        // Number has not changed.  Is there any to check
        if (l.BasedOn.getEMPLineModifiers().length == 0) {
          return false
        }
        // Compare the values
        return !compareModifiers(line)

      case (productmodel.CWPSLine):
        var l = line as CWPSLine
        if (l.BasedOn.getSHCLineModifiers().length != l.getSHCLineModifiers().length) {
          return true
        }
        // Number has not changed.  Is there any to check
        if (l.BasedOn.getSHCLineModifiers().length == 0) {
          return false
        }
        // Compare the values
        return !compareModifiers(line)

      case (productmodel.INDCoPLine):
      case (productmodel.INDCPXLine):
        if (line.BasedOn.AssociatedPolicyPeriod.getEffectiveDatedFields().getProductModifiers().length != line.AssociatedPolicyPeriod.getEffectiveDatedFields().getProductModifiers().length) {
          return true
        }
        // Number has not changed.  Is there any to check
        if (line.BasedOn.getAssociatedPolicyPeriod().getEffectiveDatedFields().getProductModifiers().length == 0) {
          return false
        }
        // Compare the values
        return !compareModifiers(line)
    }

    // Has the number of Modifiers changed
    return false
  }

  private function compareModifiers(line : PolicyLine) : boolean {
    var modifierList = createTypeKeyModifierList(line, false)
    var basedOnModifierList = createTypeKeyModifierList(line, true)
    return compareStringLists(modifierList, basedOnModifierList)
  }

  private function createTypeKeyModifierList(line : PolicyLine, basedOn : boolean) : List<String> {
    var typeKeyModifierList : List<String>
    switch (typeof line) {
      case (productmodel.EMPWPCLine):
        var l = line as EMPWPCLine
        if (basedOn) {
          typeKeyModifierList = l.BasedOn.typeKeyModifiersAsList()
        } else {
          typeKeyModifierList = l.typeKeyModifiersAsList()
        }
        break
      case (productmodel.CWPSLine):
        var l = line as CWPSLine
        if (basedOn) {
          typeKeyModifierList = l.BasedOn.typeKeyModifiersAsList()
        } else {
          typeKeyModifierList = l.typeKeyModifiersAsList()
        }
        break
      case (productmodel.INDCoPLine):
      case (productmodel.INDCPXLine):
        if (basedOn) {
          typeKeyModifierList = line.BasedOn.policyLineTypeKeyModifiersAsList()
        } else {
          typeKeyModifierList = line.policyLineTypeKeyModifiersAsList()
        }
        break
    }
    return typeKeyModifierList
  }

  private function compareStringLists(a : List<String>, b : List<String>) : boolean {
    // The lists will not be null
    if (a.size() != b.size()) {
      return false
    }
    Collections.sort(a)
    Collections.sort(b)
    return a.equals(b)
  }

  /**
   * Has the renumeration amounts changed for this policy
   * @return boolean
   */
  public function hasRenumerationChanged_ACC(line : PolicyLine): boolean {

    var wpsLine = line as productmodel.CWPSLine
    var currentRem : MonetaryAmount =  new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
    var previousRem : MonetaryAmount = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)

    for (she in wpsLine.PolicyShareholders) {
      currentRem = currentRem.add(she.sumRemuneration())
    }
    for (she in wpsLine.getAssociatedPolicyPeriod().BasedOn.CWPSLine.PolicyShareholders) {
      previousRem = previousRem.add(she.sumRemuneration())
    }

    return (previousRem != currentRem)
  }

  /**
   * Has the CPX Been added or removed
   * @return boolean
   */
  public function hasCPXBeenAddedOrRemoved_ACC(line : PolicyLine, isCPLine : boolean): boolean {

    var cpLine = (isCPLine ? line as productmodel.INDCoPLine : line as productmodel.INDCPXLine)

    //CPX Removed
    if (cpLine.AssociatedPolicyPeriod.BasedOn.INDCPXLineExists and
        !cpLine.AssociatedPolicyPeriod.INDCPXLineExists)  {
      return true
    }
    //CPX Added
    if (!cpLine.AssociatedPolicyPeriod.BasedOn.INDCPXLineExists and
        cpLine.AssociatedPolicyPeriod.INDCPXLineExists)  {
      return true
    }
    return false
  }

  /**
   * Has the Bic Codes changed for this policy
   * @return boolean
   */
  public function hasBicCodeChanged_ACC(line: PolicyLine): boolean {

    if (line.BasedOn.BICCodes.length != line.BICCodes.length) {
      return true
    }

    if (line.BICCodes.where(\elt ->
        elt.BasedOn?.BICCode != elt.BICCode).length > 0) {
      return true
    }
    return false
  }

  /**
   * Has the Bic Codes changed for this policy
   * @return boolean
   */
  public function hasBicPercentageChanged_ACC(line: PolicyLine): boolean {

    if (line.BICCodes.where(\elt ->
    elt.BasedOn?.Percentage != elt.Percentage).length > 0) {
      return true
    }
    return false
  }

  /**
   * Has the liable Earnings changed for this policy
   * @return boolean
   */
  public function hasLiableEarningsChanged_ACC(line : PolicyLine): boolean {

    var previousLE = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
    var currentLE  = new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)

    switch (typeof line) {
      case (productmodel.EMPWPCLine):
        var policyLine = line as productmodel.EMPWPCLine

        previousLE = policyLine.AssociatedPolicyPeriod.BasedOn.EMPWPCLine?.EMPWPCCovs.first().LiableEarningCov.AdjustedLiableEarnings
        currentLE = policyLine.AssociatedPolicyPeriod.EMPWPCLine?.EMPWPCCovs.first().LiableEarningCov.AdjustedLiableEarnings
        break

      case (productmodel.CWPSLine):
        var policyLine = line as productmodel.CWPSLine
        previousLE = new MonetaryAmount(policyLine.AssociatedPolicyPeriod.BasedOn.CWPSLine.PolicyShareholders.sum(\c -> c.sumLiableEarnings()), Currency.TC_NZD)
        currentLE = new MonetaryAmount(policyLine.AssociatedPolicyPeriod.CWPSLine.PolicyShareholders.sum(\c -> c.sumLiableEarnings()), Currency.TC_NZD)
        break

      case (productmodel.INDCoPLine):
        var policyLine = line as productmodel.INDCoPLine
        previousLE = policyLine.AssociatedPolicyPeriod.BasedOn.INDCoPLine.INDCoPCovs.first().LiableEarningCov.TotalLiableEarnings
        currentLE = policyLine.AssociatedPolicyPeriod.INDCoPLine?.INDCoPCovs.first().LiableEarningCov.TotalLiableEarnings
        break

      case (productmodel.INDCPXLine):
        // No LE here
        return false
    }

    return previousLE != currentLE
  }

  /**
   * get the change amount and make it absolute and add GST
   */
  private function createChangeAmountWithGST_ACC(): void {

    var chgAmount = BigDecimal.ZERO

    if (isAudit) {
      var totalCost = period_ACC.AllCosts?.AmountSum(period_ACC.PreferredSettlementCurrency) == null ? new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD) : period_ACC.AllCosts?.AmountSum(period_ACC.PreferredSettlementCurrency)
      var basedOnTotalCost = period_ACC.BasedOn?.TotalCostRPT == null ? new MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD) : period_ACC.BasedOn?.TotalCostRPT
      chgAmount = totalCost - basedOnTotalCost
    } else {
      chgAmount = period_ACC.TransactionCostRPT.Amount
    }

    if (chgAmount < 0) {
      // Make Absolute of any negative numbers
      chgAmount = -chgAmount
    }

    // The change amount is GST Inclusive.  We need GST Exclusive
    chgAmount = GSTUtil_ACC.subtractGSTFromAmount_ACC(chgAmount.doubleValue())

    // Save this for the UW Rules and profile Rules
    this.policyChangeAmount = new MonetaryAmount(chgAmount, Currency.TC_NZD)
  }
}