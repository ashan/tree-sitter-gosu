package edge.capabilities.policychange.util

uses java.util.Date
uses gw.api.locale.DisplayKey

/**
 *
 */
class PolicyChangeUtil {
  /**
   * Checks if a policy change can be started or modified for the given policy.
   *
   * @see DefaultPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String) for an explanation on the
   * conditions checked by this method.
   */
  @Param("policy","The target policy")
  @Returns("'null' if a policy change can be started or modified. An error message otherwise")
  static function checkPolicyChangeCanBeStarted(policy:Policy) : String {
    if ( policy.LatestBoundPeriod.Canceled ) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnCancelledPolicy")
    }

    if ( policy.RewrittenToNewAccountDestination != null ) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnRewrittenPolicy")
    }

    if ( !policy.Issued ) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnNotIssuedPolicy")
    }

    var openJobs = policy.OpenJobs.where(\ j -> j.SelectedVersion.Status != PolicyPeriodStatus.TC_BOUND)
    var openChangeJobs = openJobs.whereTypeIs(PolicyChange)

    if ( openChangeJobs.Count > 1 ) {
        return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.OutOfSequence")
    }
    if ( openJobs.hasMatch( \ j ->
               j typeis Rewrite
            || j typeis RewriteNewAccount
            || j typeis Cancellation
            || j typeis Reinstatement)) {
        return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.OutOfSequence")
    }

    var changeDate = computeMinimumStartDate(policy)
    return policy.canStartPolicyChange(changeDate)
  }

  /**
   * Computes the minimum date for the effective date in a policy change. This method assumes that
   * {@link #checkPolicyChangeCanBeStarted(entity.Policy)} returns 'null' for the given policy.
   *
   * The date returned will be the minimum date between today and the edit effective date for the latest bound
   * policy period.
   */
  static function computeMinimumStartDate(policy:Policy) : Date {
    var openChangeJobs = policy.OpenJobs.where(\ j -> j typeis PolicyChange && j.SelectedVersion.Status != PolicyPeriodStatus.TC_BOUND)
    var changeDate : Date
    if ( openChangeJobs.HasElements ) {
      changeDate = openChangeJobs.first().LatestPeriod.EditEffectiveDate
    } else {
      changeDate = policy.CompletedPeriodsWithCost
          .where( \ p -> PolicyChangePlatformUtil.getJobFrom(p) typeis PolicyChange)
          .orderByDescending(\p -> p.EditEffectiveDate)
          .first()
          .EditEffectiveDate
  }
    if (changeDate == null || changeDate < gw.api.util.DateUtil.endOfDay(Date.Today)) {
      // Change date can't be null or in the past
      changeDate = gw.api.util.DateUtil.endOfDay(Date.Today)
    }

    return changeDate
  }
}
