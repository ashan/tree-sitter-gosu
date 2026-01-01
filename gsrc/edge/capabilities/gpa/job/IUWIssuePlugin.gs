package edge.capabilities.gpa.job

uses edge.capabilities.gpa.job.dto.UWIssueDTO

interface IUWIssuePlugin {

  public function toDTO(aUWIssue : UWIssue) : UWIssueDTO
  public function toDTOArray(uwIssues : UWIssue[]) : UWIssueDTO[]
  public function toDTOArray(aJob : Job) : UWIssueDTO[]
}
