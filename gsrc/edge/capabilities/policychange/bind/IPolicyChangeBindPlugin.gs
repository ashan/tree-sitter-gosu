package edge.capabilities.policychange.bind

uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException
uses edge.capabilities.policychange.dto.PaymentDetailsDTO
uses edge.capabilities.policychange.bind.dto.PolicyChangeBindDTO

/**
 * Policy Change binding plugin.
 */
interface IPolicyChangeBindPlugin {
  /**
   * Binds a policy change.
   */
  @Param("policyChange","The policy change to be bound")
  @Param("paymentDetails","Details of how the change in premium should be paid")
  @Throws(PolicyChangeUnderwritingException,"When the policy change could not be bound")
  @Returns("A boolean describing whether or not an attempt to apply changes foward to an unbound policy renewal was successful")
  public function bind(policyChange : PolicyChange, paymentDetails : PaymentDetailsDTO) : boolean
}
