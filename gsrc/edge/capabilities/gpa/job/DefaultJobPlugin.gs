package edge.capabilities.gpa.job

uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.gpa.job.dto.JobDTO
uses edge.capabilities.gpa.policy.IPolicyPeriodPlugin
uses edge.capabilities.policychange.util.PolicyChangeUtil
uses edge.di.annotations.ForAllGwNodes
uses java.util.ArrayList
uses java.util.HashSet
uses edge.capabilities.gpa.policy.IPolicyPlugin
uses java.util.Date
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses edge.time.LocalDateUtil
uses gw.pcf.UWActivityPopupHelper

class DefaultJobPlugin implements IJobPlugin {

  var _policyPlugin : IPolicyPlugin
  var _policyPeriodPlugin : IPolicyPeriodPlugin
  var _uwIssuePlugin : IUWIssuePlugin

  @ForAllGwNodes
  construct(aPolicyPlugin : IPolicyPlugin, aPolicyPeriodPlugin : IPolicyPeriodPlugin, aUWIssuePlugin : IUWIssuePlugin){
    this._policyPlugin = aPolicyPlugin
    this._policyPeriodPlugin = aPolicyPeriodPlugin
    this._uwIssuePlugin = aUWIssuePlugin
  }
  override function toDTO(aJob: Job): JobDTO {
    final var dto = new JobDTO()
    fillBaseProperties(dto, aJob)
    final var currentUser : User = User.util.CurrentUser
    dto.CanUserView = currentUser.canView(aJob)
    dto.Policy = _policyPlugin.toDTO(aJob.Policy)
    dto.LatestPeriod = _policyPeriodPlugin.toDTO(aJob.LatestPeriod)

    return dto
  }

  override function toDTO(policyPeriod : PolicyPeriod) : JobDTO {
    var jobDTO = new JobDTO()
    toDTO(jobDTO, policyPeriod)
    return jobDTO
  }
  
  private function toDTO(jobDTO:JobDTO, period:PolicyPeriod) {
    var job = period.Job
    jobDTO.PublicID = job.PublicID
    jobDTO.JobNumber = job.JobNumber
    jobDTO.CreateTime = job.CreateTime
    jobDTO.CloseDate = period.Job.CloseDate
    jobDTO.Policy = _policyPlugin.toDTO(period.Policy)
    jobDTO.Status = job.DisplayStatus

  }

  override function toDTOArray(jobs: Job[]): JobDTO[] {
    if(jobs != null && jobs.HasElements){
      return jobs.map( \ aJob -> toDTO(aJob))
    }

    return new JobDTO[]{}
  }

  public static function fillBaseProperties(dto: JobDTO, aJob: Job) {
    dto.PublicID = aJob.PublicID
    dto.DisplayType = aJob.DisplayType
    dto.Status = aJob.DisplayStatus
    dto.CloseDate = aJob.CloseDate
    dto.CreateTime = aJob.CreateTime
    dto.JobNumber = aJob.JobNumber
    dto.Type = aJob.Subtype
    dto.CreatedByMe = aJob.CreateUser == User.util.CurrentUser
  }

  override function getOpenJobsByJobTypeForCurrentUser(jobType: typekey.Job): JobDTO[] {
    final var currentUser : User = User.util.CurrentUser
    final var producerCodes = currentUser.UserProducerCodes*.ProducerCode
    final var accounts = new HashSet<Account>()
    final var openJobs = new HashSet<Job>()

    producerCodes.each( \ code -> {
      final var accProdCodes = gw.api.database.Query.make(AccountProducerCode).compare("ProducerCode", Equals, code).select()
      if(accProdCodes.HasElements){
        accProdCodes.each( \ accProducerCode -> accounts.add(accProducerCode.Account))
      }
    })

    accounts.each( \ account -> {
      var accountJobs = account.getAllJobs(false, jobType, null, currentUser)
      accountJobs.each( \ aJob -> openJobs.add(aJob))
    })


    return toDTOArray(openJobs.toTypedArray())
  }

  override function getUWIssuesForJob(aJob: Job): UWIssueDTO[] {
    var authProfiles = User.util.CurrentUser.UWAuthorityProfiles
    var uwIssues = aJob.SelectedVersion.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles)
    return _uwIssuePlugin.toDTOArray(uwIssues)
  }

  override function referToUnderwriter(aJob : Job, noteForUnderWriter : String): Job {
    var approvalOption = "UWRequest"
    var note : Note = null
    var bundle = gw.transaction.Transaction.getCurrent()
    aJob = bundle.add(aJob)

    var assigneePicker = gw.pcf.UWActivityPopupHelper.getDefaultAssignee(approvalOption, aJob.LatestPeriod)
    var activityPattern = ActivityPattern.finder.getActivityPatternByCode("approve_general")
    var activity = createUWActivity(activityPattern, aJob.LatestPeriod)

    if(noteForUnderWriter != null) {
      note = createUWNote(activity, noteForUnderWriter)
    }

    UWActivityPopupHelper.updatePolicyPeriodAndActivity(note, assigneePicker, approvalOption, aJob.LatestPeriod, activity)

    bundle.commit()
    return aJob
  }

  function createUWActivity(anActivityPattern : ActivityPattern, policyPeriod : PolicyPeriod) : Activity {
    var activity = anActivityPattern.createJobActivity( policyPeriod.Job.Bundle, policyPeriod.Job, null, null, null, null, null, null, null )
    activity.TargetDate = Date.Tomorrow
    activity.setFieldValue("PreviousUser", User.util.CurrentUser) // Works for Diamond, Emerald, & Ferrite. May be better to use ActivityUtil.setPreviousUserOnNewActivity which is available in Emerald / Ferrite
    return activity
  }

  function createUWNote(anActivity : Activity, noteForUW : String) : Note {
    if(perm.Note.create){
      var note = anActivity.newNote()
      note.Topic = NoteTopicType.TC_GENERAL
      note.Body = noteForUW
      return note
    }

    return null
  }
}
