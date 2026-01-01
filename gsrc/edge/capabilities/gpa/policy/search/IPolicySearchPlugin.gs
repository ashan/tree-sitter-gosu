package edge.capabilities.gpa.policy.search


uses java.lang.Integer
uses edge.capabilities.helpers.pagination.dto.QueryOptionsDTO
uses edge.capabilities.helpers.pagination.dto.QueryParameterDTO

interface IPolicySearchPlugin {

  public function getPoliciesForProducerCodes(createdInLastXDays : Integer,producerCodes : ProducerCode[], queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : Policy[]
  public function getPoliciesForCurrentUser(createdInLastXDays : Integer, queryOptions : QueryOptionsDTO, queryParameters : QueryParameterDTO[]) : Policy[]
}
