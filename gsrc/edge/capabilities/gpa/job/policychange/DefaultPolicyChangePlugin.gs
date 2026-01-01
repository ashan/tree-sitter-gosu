package edge.capabilities.gpa.job.policychange

uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeDTO
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Exception
uses java.lang.IllegalArgumentException
uses java.util.Date
uses edge.PlatformSupport.Bundle
uses gw.api.locale.DisplayKey
uses edge.capabilities.gpa.policy.IPolicyPlugin
uses edge.capabilities.gpa.job.IUWIssuePlugin
uses edge.capabilities.gpa.job.DefaultJobPlugin
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses edge.capabilities.gpa.job.IJobPlugin

class DefaultPolicyChangePlugin implements IPolicyChangePlugin {

  var _policyPlugin : IPolicyPlugin
  var _uwIssuePlugin : IUWIssuePlugin
  var _jobPlugin : IJobPlugin

  @ForAllGwNodes
  construct(aPolicyPlugin : IPolicyPlugin, aUWIssuePlugin : IUWIssuePlugin, aJobPlugin : IJobPlugin) {
    this._policyPlugin = aPolicyPlugin
    this._uwIssuePlugin = aUWIssuePlugin
    this._jobPlugin = aJobPlugin
  }

  override function toDTO(aPolicyChange: PolicyChange): PolicyChangeDTO {
    final var dto = new PolicyChangeDTO()
    DefaultJobPlugin.fillBaseProperties(dto, aPolicyChange)
    dto.Policy = _policyPlugin.policyBaseDetailsToDTO(aPolicyChange.Policy)
    dto.StatusCode = aPolicyChange.LatestPeriod.Status
    dto.IsEditLocked = aPolicyChange.LatestPeriod.EditLocked
    dto.CanUserView = perm.PolicyChange.view(aPolicyChange)

    var authProfiles = User.util.CurrentUser.UWAuthorityProfiles
    var uwIssues = aPolicyChange.SelectedVersion.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles)
    dto.UnderwritingIssues = _uwIssuePlugin.toDTOArray(uwIssues)

    return dto
  }

  override function toDTOArray(policyChanges: PolicyChange[]): PolicyChangeDTO[] {
    if(policyChanges != null && policyChanges.HasElements){
      return policyChanges.map( \ aPolicyChange -> toDTO(aPolicyChange))
    }

    return new PolicyChangeDTO[]{}
  }

  override function startPolicyChange(aPolicy: Policy, dto: PolicyChangeDTO): PolicyChange {
    if (aPolicy == null){
      throw new IllegalArgumentException("Policy must not be null.")
    }

    final var canStartPolicyChange = aPolicy.canStartPolicyChange(dto.EffectiveDate)
    if (aPolicy != null && canStartPolicyChange == null){
      final var latestPeriod = aPolicy.LatestPeriod
      if (perm.PolicyPeriod.change(latestPeriod) and aPolicy.Issued){
        var job = new PolicyChange()
        job.Description = dto.Description
        job.startJob(aPolicy, dto.EffectiveDate)

        return job
      }
    }
    throw new Exception(DisplayKey.get("Web.PolicyChange.StartPolicyChange.Error", canStartPolicyChange))
  }

  override function getEffectiveDateForPolicyChange(aPolicy: Policy): Date {
    final var aPolicyChange = new PolicyChange()
    final var latestPeriod = aPolicy.LatestPeriod
    final var effectiveDate = gw.web.job.policychange.StartPolicyChangeUIHelper.applyEffectiveTimePluginForPolicyChange(latestPeriod, aPolicyChange, latestPeriod.EditEffectiveDate)
    final var bundle = Bundle.getCurrent()

    bundle.delete(aPolicyChange)

    return effectiveDate
  }

  override function getUWIssuesForPolicyChange(aPolicyChange: PolicyChange): UWIssueDTO[] {
    return _jobPlugin.getUWIssuesForJob(aPolicyChange)
  }

  override function referToUnderwriter(aPolicyChange : PolicyChange, noteForUnderWriter : String): PolicyChange {
    return _jobPlugin.referToUnderwriter(aPolicyChange, noteForUnderWriter) as PolicyChange
  }
}
