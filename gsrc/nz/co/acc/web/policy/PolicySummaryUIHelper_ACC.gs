package nz.co.acc.web.policy

uses nz.co.acc.util.finder.FinderUtil_ACC

class PolicySummaryUIHelper_ACC {

  static function getSelectablePolicyPeriods(policy : Policy) : PolicyPeriod[] {
    var selectablePolicyPeriods  = FinderUtil_ACC.findLatestBoundPolicyPeriodsForPolicy(policy)
    return selectablePolicyPeriods.toTypedArray()
  }

  static function isPeriodsDropdownAvailable(policy : Policy) : boolean {
    return {"ShareholdingCompany", "EmployerACC", "AccreditedEmployersProgramme", "IndividualACC" }.contains(policy.ProductCode)
  }

}