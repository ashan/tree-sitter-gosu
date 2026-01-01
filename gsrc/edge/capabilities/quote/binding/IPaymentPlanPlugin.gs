package edge.capabilities.quote.binding

uses edge.capabilities.quote.binding.dto.PaymentPlanDTO

/**
 * API for dealing with payment plans on the policy periods.
 * <p>Internal payment structure is different between different PC platform versions. This plugin abstract these
 * differences and provide all payment-plan-related functionality to Binding plugin.
 * This plugin have a default Guidewire implementation for each platform and can be used as a sample for configuration
 * plugins.
 */
interface IPaymentPlanPlugin {
  /**
   * Returns all payment plans available for the specific policy period.
   */
  public function getAvailablePaymentPlans(period : PolicyPeriod) : PaymentPlanDTO[]

  /**
   * Returns a payment plan DTO for the selected payment plan on the policy period. Returns <code>null</code> if
   * policy period have no active payment plan.
   */
  public function getSelectedPaymentPlan(period : PolicyPeriod) : PaymentPlanDTO


  /**
   * Selects a policy period payment plan for a policy period. <code>planId</code> value corresponds to
   * PaymentPlanDTO#BillingId received from #getAvailablePaymentPlans(PolicyPeriod).
   */
  @Throws(java.lang.IllegalArgumentException, "If payment plan ID is not valid for the given policy period")
  public function selectPaymentPlan(period : PolicyPeriod, planId :  String)
}
