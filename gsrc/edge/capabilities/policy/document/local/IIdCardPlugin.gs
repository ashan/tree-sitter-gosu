package edge.capabilities.policy.document.local

uses edge.capabilities.document.dto.DocumentReferenceDTO

/**
 * Plugin to retrieve ID cards for the policy.
 * <p>This plugin assumes that user already have an access to policy in question.</p>
 */
interface IIdCardPlugin {
  /**
   * Fetches an information about ID card associated with the policy.
   */
  @Param("policy", "Policy to fetch an ID card for")
  @Returns("Reference to a policy ID card or null if there is no ID card")
  public function getIdCardDocument(policy : PolicyPeriod) : DocumentReferenceDTO
}
