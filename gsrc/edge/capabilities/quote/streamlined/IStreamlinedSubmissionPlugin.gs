package edge.capabilities.quote.streamlined

uses edge.capabilities.quote.streamlined.dto.StreamlinedQuoteDTO
uses edge.capabilities.quote.draft.dto.DraftDataDTO
uses edge.capabilities.quote.lob.personalauto.draft.dto.DriverDTO
uses edge.capabilities.quote.lob.personalauto.draft.dto.VehicleDTO
uses edge.capabilities.policycommon.accountcontact.dto.AccountContactDTO

/**
 * Plugin used to manage draft creation and update. It works with base
 * policy data (persons, vehicles, locations, etc...) but not with coverages
 * or prices.
 * <p>This plugin is responsible for ensuring product availability.
 */
interface IStreamlinedSubmissionPlugin {
  /**
   * Creates a new submission and populates it with essential submission data.
   */
  @Param("productCode", "Product code to create submission for")
  @Param("data", "Data sent by the user")
  public function createSubmission(data : StreamlinedQuoteDTO) : Submission

  /**
   * Converts submission to submission data.
   */
  public function toDTO(period : PolicyPeriod) : DraftDataDTO

  /**
   * Used to allow for prefill of required data for quick quoting for accounts.
   */
  public function createStreamlinedAccountInfo(data : StreamlinedQuoteDTO) : AccountContactDTO

  /**
   * Used to allow for prefill of required data for quick quoting for vehicles.
   */
  public function createStreamlinedVehicle(data : StreamlinedQuoteDTO) : VehicleDTO

  /**
   * Used to allow for prefill of required data for quick quoting for drivers.
   */
  public function createStreamlinedDriver(accountHolder : Person) : DriverDTO
}
