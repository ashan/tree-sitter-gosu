package nz.co.acc.policy

enhancement PolicyPeriodSummaryEnhancement_ACC : entity.PolicyPeriodSummary {

  function getPolicyPeriodSlice_ACC() : PolicyPeriod {
    var summaryPolicyPeriod = this.fetchPolicyPeriod()
    return summaryPolicyPeriod.getSlice(summaryPolicyPeriod.PeriodStart)
  }

  public property get ActiveTermDisplayString_ACC() : String {
    var activeTerm = this.ActiveTerm_ACC
    if (activeTerm != null and activeTerm) {
      return "Yes"
    } else {
      return "No"
    }
  }

  public property get ValidForClaimsDisplayString_ACC() : String {
    if (this?.ValidForClaimsReg_ACC) {
      return "Yes"
    } else {
      return "No"
    }
  }

  function fetchPolicyTerm_ACC() : PolicyTerm {
    return this.fetchPolicyPeriod().PolicyTerm
  }
}
