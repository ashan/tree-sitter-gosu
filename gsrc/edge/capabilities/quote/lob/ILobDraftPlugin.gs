package edge.capabilities.quote.lob

/**
 * Base interface which should be implemented by Line-of-business extensions
 * of the core product.
 * <p>
 * There is no single user for the whole interface. Usually each class 
 * use only one or two methods from this. However, this is a _convenience_ interface.
 * It collects all the methods that new LOB should implement in the default configuration.
 */
interface ILobDraftPlugin<DtoT> {
  /**
   * Checks, if lob extension is compatible with the given product.
   */
  public function compatibleWithProduct(code : String) : boolean
  
  
  /**
   * Initializes a new submission. This method is called only once for each 
   * submission.
   */
  public function updateNewDraftSubmission(period : PolicyPeriod, update : DtoT)

  /**
   * Updates a draft fields on the existing submission.
   */
  public function updateExistingDraftSubmission(period : PolicyPeriod, update : DtoT)
  
  
  /**
   * Converts submission into a draft DTO.
   */
  public function toDraftDTO(period : PolicyPeriod) : DtoT
}
