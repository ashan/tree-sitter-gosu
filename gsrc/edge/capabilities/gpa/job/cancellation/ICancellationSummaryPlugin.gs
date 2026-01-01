package edge.capabilities.gpa.job.cancellation

uses edge.capabilities.gpa.job.cancellation.dto.CancellationSummaryDTO

interface ICancellationSummaryPlugin {

  public function toDTO(aCancellation : Cancellation) : CancellationSummaryDTO

}
