package edge.capabilities.quote.binding

uses edge.capabilities.quote.binding.dto.PaymentDetailsDTO

/**
 * Policy payment processor. This handler is used by default binding plugin and 
 * is executed during the active binding transaction.
 */
interface IPolicyPaymentPlugin {

  public function pay(sub : Submission, period : PolicyPeriod, instrument : PaymentDetailsDTO)

}
