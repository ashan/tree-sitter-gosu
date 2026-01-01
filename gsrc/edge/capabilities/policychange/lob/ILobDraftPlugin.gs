package edge.capabilities.policychange.lob

uses gw.api.diff.DiffItem
uses edge.capabilities.policychange.dto.PolicyChangeHistoryDTO

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
   * Updates a draft fields on the existing policy change.
   */
  public function updateExistingDraftSubmission(period : PolicyPeriod, update : DtoT)
  
  
  /**
   * Converts a policy change into a draft DTO.
   */
  public function toDraftDTO(period : PolicyPeriod) : DtoT

  /**
   * Generates a history item DTO from a DiffItem.
   */
  @Returns("The history item DTO if this item is relevant for the LOB, null otherwise")
  public function toHistoryDTO(diff:DiffItem):PolicyChangeHistoryDTO
}
