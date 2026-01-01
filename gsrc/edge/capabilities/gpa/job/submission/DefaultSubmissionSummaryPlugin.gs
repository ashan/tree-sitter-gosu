package edge.capabilities.gpa.job.submission

uses edge.capabilities.gpa.activity.IActivityPlugin
uses edge.capabilities.gpa.job.submission.dto.SubmissionSummaryDTO
uses java.lang.Exception
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.helpers.ActivityUtil
uses edge.di.annotations.ForAllGwNodes

class DefaultSubmissionSummaryPlugin implements ISubmissionSummaryPlugin {

  private var _documentPlugin: IDocumentPlugin
  private var _notePlugin: INotePlugin
  private var _activitiesHelper: ActivityUtil

  @ForAllGwNodes
  construct(aDocumentPlugin : IDocumentPlugin, aNotesPlugin : INotePlugin, anActivityHelper: ActivityUtil){
    _documentPlugin = aDocumentPlugin
    _notePlugin = aNotesPlugin
    _activitiesHelper = anActivityHelper
  }

  override function toDTO(aSubmission: Submission): SubmissionSummaryDTO {
    final var dto = new SubmissionSummaryDTO()

    try {
      dto.NumberOfNotes = _notePlugin.getNotesForJob(aSubmission).Count
    } catch (e: Exception) {
      dto.NumberOfNotes = 0
    }

    try {
      dto.NumberOfDocuments = _documentPlugin.getDocumentsForJob(aSubmission).Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }


    try {
        dto.NumberOfOpenActivities = aSubmission.AllOpenActivities.where(\anActivity -> perm.Activity.view(anActivity)).Count
      } catch (e: Exception) {
        dto.NumberOfOpenActivities = 0
      }

    try {
      var authProfiles = User.util.CurrentUser.UWAuthorityProfiles
      var uwIssues = aSubmission.SelectedVersion.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles)
      dto.NumberOfUWIssues = uwIssues.Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }


    return dto
  }

}
