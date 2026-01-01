package edge.capabilities.policychange.quote

uses edge.capabilities.policychange.exception.PolicyChangeUnderwritingException

interface IPolicyChangeQuotePlugin {
  /**
   * Quotes a policy change.
   */
  @Param("policyChange","The policy change to be quoted")
  @Throws(PolicyChangeUnderwritingException,"When the policy change could not be quoted")
  public function quote(job : Job)
}
