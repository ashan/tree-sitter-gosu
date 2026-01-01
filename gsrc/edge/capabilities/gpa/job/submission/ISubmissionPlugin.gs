package edge.capabilities.gpa.job.submission

uses edge.capabilities.gpa.job.submission.dto.NewSubmissionDTO
uses edge.capabilities.gpa.job.submission.dto.ProductSelectionDTO
uses edge.capabilities.gpa.job.submission.dto.SubmissionDTO
uses edge.capabilities.gpa.job.dto.UWIssueDTO

interface ISubmissionPlugin {

  public function toDTO(aSubmission : Submission) : SubmissionDTO
  public function toDTOArray(submissions : Submission[]) : SubmissionDTO[]
  public function createSubmission(anAccount : Account, dto : NewSubmissionDTO) : Submission
  public function getAvailableProducts(anAccount : Account, dto : NewSubmissionDTO) : ProductSelectionDTO[]
  public function getUWIssuesForSubmission(aSubmission : Submission) : UWIssueDTO[]
  public function referToUnderwriter(submission : Submission, noteForUnderwriter : String): Submission
}
