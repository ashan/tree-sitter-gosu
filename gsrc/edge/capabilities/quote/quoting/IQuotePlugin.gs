package edge.capabilities.quote.quoting
uses edge.capabilities.quote.quoting.dto.QuotingDTO
uses edge.capabilities.quote.quoting.dto.QuoteDTO
uses edge.capabilities.quote.quoting.exception.UnderwritingException

/**
 * Interface used by quoting handler for quoting process.
 */
interface IQuotePlugin {
  /**
   * Tries to quote the submission using base and all available offerings.
   * Client needs to handle case where UnderwritingException is thrown. e.g. withdraw policy periods
   */
  @Param("sub", "submission to quote")
  @Param("checkForBlockIssueUWIssues", "indicate if we should check for UW issues that blocks issuance")
  @Throws(UnderwritingException, "If there was a problem quoting any of the periods in the submission.")
  public function quoteAllOfferings(sub : Submission, checkForBlockIssueUWIssues : Boolean)

  /**
   * Tries to quote the submission using the base offering only.
   * Client needs to handle case where UnderwritingException is thrown. e.g. withdraw policy periods
   */
  @Param("sub", "submission to quote")
  @Param("checkForBlockIssueUWIssues", "indicate if we should check for UW issues that blocks issuance")
  @Throws(UnderwritingException, "If there was a problem quoting the submission.")
  public function quoteBaseOffering(sub : Submission, checkForBlockIssueUWIssues : Boolean)

  /**
   * Updates a custom quote data (coverages, etc...). Plugin must requote period after
   * it was updated.
   */
  @Param("period", "Custom period to quote")
  @Param("data", "Data for updated quote")
  @Throws(UnderwritingException, "If there was a problem quoting the policy period.")
  public function updateCustomQuote(period : PolicyPeriod, data : QuoteDTO)

  /**
   * Just updates the coverages for a custom quote and synchronizes those coverages with the product model.
   * Does <strong>not</strong> requote the policy period
   */
  @Param("period", "Custom period to quote")
  @Param("data", "Data for updated quote")
  public function syncCustomQuoteCoverages(period : PolicyPeriod, data : QuoteDTO)
  
  /**
   * Converts submission to a quote DTO.
   */
  public function toDTO(sub : Submission, checkForBlockIssueUWIssues : Boolean) : QuotingDTO


  /**
   * Converts policy period to a quote DTO.
   */
  public function toQuoteDTO(period : PolicyPeriod, checkForBlockIssueUWIssues : Boolean) : QuoteDTO
}
