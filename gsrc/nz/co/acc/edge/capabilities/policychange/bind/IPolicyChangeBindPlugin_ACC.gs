package nz.co.acc.edge.capabilities.policychange.bind

uses edge.capabilities.policychange.dto.PaymentDetailsDTO
uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException

/**
 * Policy Change binding plugin.
 */
interface IPolicyChangeBindPlugin_ACC {
  /**
   * Binds a policy change.
   */
  @Param("policyChange", "The policy change to be bound")
  @Throws(PolicyChangeUnderwritingException, "When the policy change could not be bound")
  @Returns("A boolean describing whether or not an attempt to apply changes foward to an unbound policy renewal was successful")
  public function bind_ACC(job: Job): boolean
}
