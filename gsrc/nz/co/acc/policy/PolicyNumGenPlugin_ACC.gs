package nz.co.acc.policy

uses gw.plugin.policy.impl.PolicyNumGenPlugin


@Export
class PolicyNumGenPlugin_ACC extends PolicyNumGenPlugin {

  override function genNewPeriodPolicyNumber( policyPeriod: PolicyPeriod ) : String {
    if (policyPeriod.Migrated_ACC and policyPeriod.PolicyNumber?.HasContent) {
      return policyPeriod.PolicyNumber
    }
    return super.genNewPeriodPolicyNumber(policyPeriod)
  }

}
