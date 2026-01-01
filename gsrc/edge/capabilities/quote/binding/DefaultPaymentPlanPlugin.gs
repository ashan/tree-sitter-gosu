package edge.capabilities.quote.binding

uses gw.plugin.billing.InstallmentPlanData
uses gw.api.util.CurrencyUtil
uses java.lang.IllegalArgumentException
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.quote.binding.dto.PaymentPlanDTO
uses edge.capabilities.currency.dto.AmountDTO

/**
 * Default implementation of IPaymentPlanPlugin for the Emerald platform.
 */
class DefaultPaymentPlanPlugin implements IPaymentPlanPlugin {

  @ForAllGwNodes
  construct(){

  }

  override function getAvailablePaymentPlans(period: PolicyPeriod): PaymentPlanDTO[] {
    return period.retrievePaymentPlans().InstallmentPlans.map( \ plan -> installmentToDto(plan))

  }

  override function getSelectedPaymentPlan(period: PolicyPeriod): PaymentPlanDTO {
    final var plan = period.SelectedPaymentPlan
    return plan == null ? null : summaryToDto(plan)
  }


  override function selectPaymentPlan(period: PolicyPeriod, planId: String) {
    final var plan = findPaymentPlans(period).firstWhere( \ elt -> elt.BillingId == planId)
    if (plan == null) {
      throw new IllegalArgumentException("Bad payment plan")
    }
    period.selectPaymentPlan(plan)
  }


  /* EXTENSION SECTION. */

  /**
   * Finds all payment plans allowed for the policy period.
   */
  protected function findPaymentPlans(period : PolicyPeriod) : InstallmentPlanData[] {
    return period.retrievePaymentPlans().InstallmentPlans
  }


  /**
   * Converts an installment plan into a DTO. Default implementation just calls fillDefaultProperties to set new
   * properties on the DTO.
   */
  protected function installmentToDto(plan : InstallmentPlanData) : PaymentPlanDTO {
    final var res = new PaymentPlanDTO()
    fillDefaultProperties(res, plan)
    return res
  }


  /**
   * Converts a payment plan summary into a DTO. Default implementation just calls fillDefaultProperties to set new
   * properties on the DTO.
   */
  protected function summaryToDto(plan : PaymentPlanSummary) : PaymentPlanDTO {
    final var res = new PaymentPlanDTO()
    fillDefaultProperties(res, plan)
    return res
  }


  /* DEFAULTS/UTILITIES section. */

  /**
   * Fills base (created by Guidewire) properties on the payment plan DTO. Can be used by other plugin implementation
   * as a convenience method.
   */
  static function fillDefaultProperties(dto : PaymentPlanDTO, plan : InstallmentPlanData) {
    dto.BillingId = plan.BillingId
    dto.Name = plan.Name
    dto.DownPayment = AmountDTO.fromMonetaryAmount(plan.DownPayment)
    dto.Total = AmountDTO.fromMonetaryAmount(plan.Total)
    dto.Installment = AmountDTO.fromMonetaryAmount(plan.Installment)
  }



  /**
   * Fills base (created by Guidewire) properties on the payment plan DTO. Can be used by other plugin implementation
   * as a convenience method.
   */
  static function fillDefaultProperties(dto : PaymentPlanDTO, plan : PaymentPlanSummary) {
    dto.BillingId = plan.BillingId
    dto.Name = plan.Name
    dto.DownPayment = AmountDTO.fromMonetaryAmount(plan.DownPayment)
    dto.Total = AmountDTO.fromMonetaryAmount(plan.Total)
    dto.Installment = AmountDTO.fromMonetaryAmount(plan.Installment)
  }
}
