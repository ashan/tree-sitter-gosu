package edge.capabilities.policychange.bind

uses edge.capabilities.policychange.dto.PaymentDetailsDTO

/**
 * Policy payment processor. This handler is used by default binding plugin and 
 * is executed during the active binding transaction.
 */
interface IPolicyChangePaymentPlugin {

  public function pay(paymentDetails : PaymentDetailsDTO)

}
