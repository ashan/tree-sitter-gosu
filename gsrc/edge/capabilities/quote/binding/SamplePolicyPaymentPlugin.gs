package edge.capabilities.quote.binding

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.quote.binding.dto.PaymentDetailsDTO

/**
 * Demo payment handler. It does nothing and should be replaced in the production environment.
 */
class SamplePolicyPaymentPlugin implements IPolicyPaymentPlugin {

  @ForAllGwNodes
  construct() {

  }


  override function pay(sub : Submission, period : PolicyPeriod, instrument : PaymentDetailsDTO) {
    //## todo: Implement me
  }

}
