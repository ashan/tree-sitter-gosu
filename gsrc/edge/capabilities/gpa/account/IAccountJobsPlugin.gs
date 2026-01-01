package edge.capabilities.gpa.account

uses edge.capabilities.gpa.account.dto.AccountJobsDTO
uses java.lang.Integer
uses edge.capabilities.gpa.account.dto.AccountJobsSummaryDTO

interface IAccountJobsPlugin {

  public function toDTO(anAccount : Account, createdInLastXDays : Integer) : AccountJobsDTO
  public function toDTOArray(accounts : Account[], createdInLastXDays : Integer) : AccountJobsDTO[]
  public function accountJobsSummaryToDTO(aProducerCode : String, jobs : Job[]) : AccountJobsSummaryDTO
  public function accountJobsSummaryToDTOArray(producerCodes : ProducerCode[], jobs : Job[]) : AccountJobsSummaryDTO[]
}
