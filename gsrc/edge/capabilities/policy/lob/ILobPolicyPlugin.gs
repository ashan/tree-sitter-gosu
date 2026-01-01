package edge.capabilities.policy.lob


/**
 * Plugin to access policy line information
 *
 */
public interface ILobPolicyPlugin<TDto> {
  /**
   * Retrieves LOB information for a policy. Called from composite plugin which delegates same call to LOB plugins
   */
  public function getPolicyLineInfo(period : PolicyPeriod) : TDto
}
