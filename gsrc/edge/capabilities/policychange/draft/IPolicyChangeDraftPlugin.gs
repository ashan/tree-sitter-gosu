package edge.capabilities.policychange.draft

uses edge.capabilities.policychange.dto.PolicyChangeDTO
uses edge.capabilities.policychange.dto.TransactionDTO
uses edge.capabilities.quote.lob.dto.QuoteLobDataDTO

/**
 * Plugin to generate PolicyChangeDTOs from policy changes and to update change transaction based on a PoliyChangeDTO
 */
interface IPolicyChangeDraftPlugin {
  /**
   * Generates a DTO for a new policy change.
   */
  @Param("period","The current in-force policy period")
  @Returns("A DTO instance with the information from the current policy")
  function toDto(period:PolicyPeriod):TransactionDTO

  /**
   * Generates a DTO for an existing policy change transaction.
   */
  @Param("change","The change transaction")
  @Returns("A DTO instance with the information from the current change transaction")
  function toDto(change:PolicyChange):TransactionDTO

  /**
   * Generates a DTO for an existing policy change transaction.
   */
  @Param("change","The change transaction")
  @Returns("A DTO instance with the information from the current change transaction")
  function toDto(change:Renewal):TransactionDTO

  /**
   * Generates a DTO for an existing policy change transaction.
   */
  @Param("job","The change transaction")
  @Returns("A DTO instance with the information from the current change transaction")
  function toDto(job:Job):TransactionDTO

  /**
   * Updates a change transaction based on a PolicyChangeDTO.
   */
  @Param("change","The policy change transaction")
  @Param("dto", "The DTO")
  function updateFromDto(job:Job,dto:TransactionDTO)


  function updateCoveragesFromDto(period:PolicyPeriod, coverages:QuoteLobDataDTO)
}
