package edge.capabilities.quote.lob

/**
 * Line-of-business quoting extension plugin.
 */
interface ILobQuotingPlugin<DtoT> {
  /**
   * Returns a quote details for the given quote.
   */
  public function getQuoteDetails(pp : PolicyPeriod) : DtoT
  
  /**
   * Updates a custom quote (represented by the policy period) using user
   * update request.
   */
  public function updateCustomQuote(pp : PolicyPeriod, update : DtoT)

  /**
   * Generates policy/quote variants from a base policy period for single-line policy.
   *
   * This method is called to generate all possible quote variants (offerings, predefined quotes, etc...).
   * Plugin should create additional policy lines on the base's submission instance and that submissions
   * will be quoted automatically. All additional variants are removed when user changes draft data and this method
   * is called again during quoting.
   *  <p><em>Note<em>. This method is called for policies with single LOB only. Multi-line policies should be
   * handled by top-level quoting plugin (like CompositeLobQuotingPlugin)</p>
   */
  public function generateVariants(base:PolicyPeriod)
}
