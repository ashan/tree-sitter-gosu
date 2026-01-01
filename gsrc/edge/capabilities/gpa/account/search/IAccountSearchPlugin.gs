package edge.capabilities.gpa.account.search

uses edge.capabilities.gpa.account.search.dto.AccountSearchCriteriaDTO
uses gw.account.AccountSearchCriteria
uses java.lang.Integer

uses edge.capabilities.gpa.account.search.dto.AccountSearchSummaryDTO
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO

interface IAccountSearchPlugin {

  public function toDTO(anAccountSearchCriteria : AccountSearchCriteria) : AccountSearchCriteriaDTO
  public function createSearchCriteria(dto : AccountSearchCriteriaDTO) : AccountSearchCriteria
  public function getAccountsForProducerCode(createdInLastXDays : Integer, aProducerCode : ProducerCode, queryOptions : QueryOptionsDTO) : AccountSearchSummaryDTO
  public function getAccountsForProducerCodes(createdInLastXDays : Integer,producerCodes : ProducerCode[], queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO
  public function getAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO
  public function getAllAccountsForCurrentUser() : Account[]
  public function getAccountsForProducerCode(aProducerCode : ProducerCode) : Account[]
  public function getAccountsForProducerCodes(producerCodes : ProducerCode[]) : Account[]
  public function getPersonalAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO
  public function getPersonalAccountsForProducerCode(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, aProducerCode : ProducerCode) : AccountSearchSummaryDTO
  public function getCommercialAccountsForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : AccountSearchSummaryDTO
  public function getCommercialAccountsForProducerCode(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, aProducerCode : ProducerCode) : AccountSearchSummaryDTO
}
