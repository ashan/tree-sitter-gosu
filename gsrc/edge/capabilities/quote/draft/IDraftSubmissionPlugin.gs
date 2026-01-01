package edge.capabilities.quote.draft
uses edge.capabilities.quote.draft.dto.DraftDataDTO

/**
 * Plugin used to manage draft creation and update. It works with base
 * policy data (persons, vehicles, locations, etc...) but not with coverages
 * or prices.
 * <p>This plugin is responsible for ensuring product availability.
 */
interface IDraftSubmissionPlugin {
  /**
   * Creates a new submission and populates it with essential submission data.
   */
  @Param("productCode", "Product code to create submission for")
  @Param("data", "Data sent by the user")
  public function createSubmission(productCode : String, data : DraftDataDTO) : Submission
  
  
  /**
   * Updates existing submission with the new data.
   */
  @Param("submission", "Submission to update")
  @Param("data", "Data sent by the user")
  public function updateSubmission(submission : Submission, data : DraftDataDTO)
  
  
  
  /**
   * Converts submission to submission data.
   */
  public function toDTO(period : PolicyPeriod) : DraftDataDTO
}
