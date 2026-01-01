package edge.capabilities.gpa.job

uses edge.capabilities.gpa.job.dto.JobSummaryDTO

interface IJobSummaryPlugin {

  public function toDTO(aJob : Job) : JobSummaryDTO
  public function toDTOArray(jobs : Job[]) : JobSummaryDTO[]
}
