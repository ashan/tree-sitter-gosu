package edge.capabilities.policy.auth

/**
 * Interface used to validate policy access rules for particular policies.
 */
interface IPolicyAccessPlugin {
  /**
   * Checks if user have an access to the given policy.
   */
  @Param("user", "user to check")
  @Param("policy", "policy to check an access to")
  public function hasAccess(policy : PolicyPeriod) : Boolean

  /**
   * Checks if user have an access to the given policy.
   */
  @Param("user", "user to check")
  @Param("policy", "policy to check an access to")
  public function hasAccess(policy : Policy) : Boolean
}
