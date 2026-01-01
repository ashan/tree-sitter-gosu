package edge.capabilities.gpa.job.cancellation

uses edge.capabilities.gpa.job.cancellation.dto.CancellationSummaryDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.helpers.ActivityUtil
uses java.lang.Exception


class DefaultCancellationSummaryPlugin implements ICancellationSummaryPlugin {

  private var _documentPlugin: IDocumentPlugin
  private var _notePlugin: INotePlugin
  private var _activitiesHelper: ActivityUtil

  @ForAllGwNodes
  construct(aDocumentPlugin : IDocumentPlugin, aNotesPlugin : INotePlugin, anActivityHelper: ActivityUtil){
    _documentPlugin = aDocumentPlugin
    _notePlugin = aNotesPlugin
    _activitiesHelper = anActivityHelper
  }


  override function toDTO(aCancellation: Cancellation): CancellationSummaryDTO {
    final var dto = new CancellationSummaryDTO()

    try {
      dto.NumberOfNotes = _notePlugin.getNotesForJob(aCancellation).Count
    } catch (e: Exception) {
      dto.NumberOfNotes = 0
    }

    try {
      dto.NumberOfDocuments = _documentPlugin.getDocumentsForJob(aCancellation).Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }

    try {
      dto.NumberOfOpenActivities = aCancellation.AllOpenActivities.where(\anActivity -> perm.Activity.view(anActivity)).Count
    } catch (e: Exception) {
      dto.NumberOfOpenActivities = 0
    }

    try {
      var authProfiles = User.util.CurrentUser.UWAuthorityProfiles
      var uwIssues = aCancellation.SelectedVersion.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles)
      dto.NumberOfUWIssues = uwIssues.Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }

    return dto
  }
}
