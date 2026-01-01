package edge.capabilities.gpa.job.cancellation

uses edge.capabilities.gpa.job.cancellation.dto.CancellationDTO
uses java.util.Date
uses edge.capabilities.gpa.job.dto.UWIssueDTO

interface ICancellationPlugin {

  public function toDTO(aCancellation : Cancellation) : CancellationDTO
  public function toDTOArray(Cancellations : Cancellation[]) : CancellationDTO[]
  public function startCancellation(aPolicy : Policy, dto : CancellationDTO) : Cancellation
  public function updateCancellation(aCancellation : Cancellation, dto : CancellationDTO)
  public function getValidRefundMethods(policy: Policy, dto : CancellationDTO): CalculationMethod[]
  public function getEffectiveDateForCancellation(policy: Policy, dto : CancellationDTO): Date
  public function getUWIssuesForCancellation(aCancellation : Cancellation) : UWIssueDTO[]
  public function referToUnderwriter(aCancellation : Cancellation, noteForUnderwriter : String): Cancellation
  public function bindCancellation(aCancellation : Cancellation) : Cancellation
}
