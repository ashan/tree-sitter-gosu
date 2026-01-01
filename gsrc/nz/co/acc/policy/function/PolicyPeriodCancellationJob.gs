package nz.co.acc.policy.function

uses java.util.function.Function

/**
 * @author Ron Webb
 * @since 2019-07-01
 */
class PolicyPeriodCancellationJob implements Function<PolicyPeriod, Cancellation> {

  override function apply(policyPeriod : PolicyPeriod) : Cancellation {
    if (policyPeriod==null) {
      return null
    }

    var job = policyPeriod.Job
    if (job typeis Cancellation) {
      return job
    }
    else {
      return apply(policyPeriod.BasedOn)
    }
  }
}