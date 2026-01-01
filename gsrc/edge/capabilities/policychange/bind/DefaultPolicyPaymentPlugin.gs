package edge.capabilities.policychange.bind

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.policychange.dto.PaymentDetailsDTO

/**
 *
 */
class DefaultPolicyPaymentPlugin implements IPolicyChangePaymentPlugin {

  @ForAllGwNodes
  construct() {

  }

  override function pay(paymentDetails : PaymentDetailsDTO) {
    //## todo: Implement me
  }

}
