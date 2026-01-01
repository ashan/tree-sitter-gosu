package edge.capabilities.gpa.job.policychange

uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeSummaryDTO
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.helpers.ActivityUtil
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Exception

class DefaultPolicyChangeSummaryPlugin implements IPolicyChangeSummaryPlugin {
  
  private var _documentPlugin: IDocumentPlugin
  private var _notePlugin: INotePlugin
  private var _activitiesHelper: ActivityUtil

  @ForAllGwNodes
  construct(aDocumentPlugin : IDocumentPlugin, aNotesPlugin : INotePlugin, anActivityHelper: ActivityUtil){
    _documentPlugin = aDocumentPlugin
    _notePlugin = aNotesPlugin
    _activitiesHelper = anActivityHelper
  }

  override function toDTO(aPolicyChange: PolicyChange): PolicyChangeSummaryDTO {
    final var dto = new PolicyChangeSummaryDTO()

    try {
      dto.NumberOfNotes = _notePlugin.getNotesForJob(aPolicyChange).Count
    } catch (e: Exception) {
      dto.NumberOfNotes = 0
    }

    try {
      dto.NumberOfDocuments = _documentPlugin.getDocumentsForJob(aPolicyChange).Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }


    try {
      dto.NumberOfOpenActivities = aPolicyChange.AllOpenActivities.where(\anActivity -> perm.Activity.view(anActivity)).Count
    } catch (e: Exception) {
      dto.NumberOfOpenActivities = 0
    }

    try {
      var authProfiles = User.util.CurrentUser.UWAuthorityProfiles
      var uwIssues = aPolicyChange.SelectedVersion.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles)
      dto.NumberOfUWIssues = uwIssues.Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }


    return dto
  }

}
