package nz.co.acc.aep.account

uses gw.api.util.DateUtil

enhancement AEPAccountEnhancement : Account {

  property get AEPContractAccountWithExistingAEPPolicy_ACC() : boolean {
    return this.AEPContractAccount_ACC and
        (this.IssuedPolicies.hasMatch(\summary -> summary.ProductCode == "AccreditedEmployersProgramme") or
            this.Policies.hasMatch(\policy -> policy.IsAEPMasterPolicy_ACC and policy.Periods.hasMatch(\pp -> pp.Active)))
  }

  property get AEPMasterPolicy_ACC() : Policy {
    if (this.AEPContractAccount_ACC) {
      return this.Policies.firstWhere(\policy -> policy.IsAEPMasterPolicy_ACC and policy.IssueDate != null)
    }
    return null
  }

  function getAEPActiveMemberPoliciesForLevyYear_ACC(levyYear : Integer) : Policy[] {
    if (this.AEPContractAccount_ACC) {
      return this.Policies.where(\policy -> policy.IsAEPMemberPolicy_ACC and policy.isActiveForLevyYear_ACC(levyYear))
    }
    return new Policy[]{}
  }

  function checkIfAnyAEPMemberPolicyOnHoldFromReassessment_ACC(levyYear : Integer = null) : String {
    var policyNumberSet = new HashSet<String>()
    this.getAEPActiveMemberPoliciesForLevyYear_ACC(levyYear)?.each(\policy -> {
      if (policy.onHoldFromReassessment_ACC(levyYear)) {
        policyNumberSet.add(policy.LatestPeriod.PolicyNumber)
      }
    })
    if (policyNumberSet.Count == 0) {
      return null
    } else {
      return "holds on Member Policies (" + policyNumberSet.join(", ") + ")"
    }
  }

  property get CurrentAEPPrimeAccountNumber_ACC() : String {
    var aepPrimeAccNo : String = null
    if (this.AEPContractAccount_ACC and this.SourceRelatedAccounts.HasElements) {
      aepPrimeAccNo = this.SourceRelatedAccounts
          .where(\relationship -> relationship.RelationshipType == AccountRelationshipType.TC_AEP_PRIME_ACC
              and relationship.EffectiveDateFrom_ACC.compareTo(DateUtil.currentDate()) <= 0)
          .orderByDescending(\relationship -> relationship.EffectiveDateFrom_ACC)
          .first()
          .TargetAccount
          .AccountNumber
    }
    return aepPrimeAccNo
  }

}
