package edge.capabilities.gpa.job.submission

uses edge.capabilities.gpa.job.submission.dto.SubmissionSummaryDTO

interface ISubmissionSummaryPlugin {

  public function toDTO(aSubmission : Submission) : SubmissionSummaryDTO

}
