package edge.capabilities.gpa.job

uses edge.capabilities.gpa.job.dto.JobDTO
uses edge.capabilities.gpa.job.dto.UWIssueDTO

interface IJobPlugin {

  public function toDTO(aJob : Job) : JobDTO
  public function toDTO(policyPeriod : PolicyPeriod) : JobDTO
  public function toDTOArray(jobs : Job[]) : JobDTO[]
  public function getOpenJobsByJobTypeForCurrentUser(jobType : typekey.Job) : JobDTO[]
  public function getUWIssuesForJob(aJob : Job) : UWIssueDTO[]
  public function referToUnderwriter(aJob : Job, noteForUnderwriter : String): Job
}
