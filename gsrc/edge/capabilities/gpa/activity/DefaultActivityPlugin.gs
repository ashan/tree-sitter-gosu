package edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.gpa.activity.dto.AssignableGroupDTO
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.user.IUserPlugin
uses edge.capabilities.gpa.activity.dto.AssignableQueueDTO
uses java.lang.IllegalArgumentException
uses gw.api.database.Query
uses edge.capabilities.gpa.note.INotePlugin
uses edge.PlatformSupport.Bundle

class DefaultActivityPlugin implements IActivityPlugin {

  private var _userPlugin : IUserPlugin
  private var _activityPatternPlugin : IActivityPatternPlugin
  private var _notePlugin : INotePlugin

  @ForAllGwNodes
  construct(aUserPlugin : IUserPlugin, anActivityPatternPlugin : IActivityPatternPlugin, aNotePlugin : INotePlugin){
    this._userPlugin = aUserPlugin
    this._activityPatternPlugin = anActivityPatternPlugin
    this._notePlugin = aNotePlugin
  }

  override function toDTO(anActivity: Activity): ActivityDTO {
    final var dto = new ActivityDTO()
    fillBaseProperties(dto, anActivity)
    dto.AssignedTo = getAssignedTo(anActivity)
    dto.AssignedBy = _userPlugin.toDTO(anActivity.AssignedByUser)
    dto.IsAssignedToCurrentUser = (anActivity.AssignedUser == User.util.CurrentUser)
    dto.IsCreatedByCurrentUser = (anActivity.CreateUser == User.util.CurrentUser)
    // JUNO-3594 - don't need this expensive-to-generate field
    // dto.AssignableUsers = getAssignableUsers(anActivity)
    dto.ActivityPattern = _activityPatternPlugin.toDTO(anActivity.ActivityPattern)
    dto.CreatedBy = anActivity.CreateUser.DisplayName
    dto.EscalationDate = anActivity.EscalationDate

    if (anActivity.Policy != null) {
      dto.PolicyNumber = anActivity.Policy.LatestPeriod.PolicyNumber
      dto.ProductCode =  anActivity.Policy.ProductCode.toString()
      dto.ProductName = gw.api.productmodel.ProductLookup.getByCodeIdentifier(anActivity.Policy.ProductCode).Name
    }

    if(anActivity.Job != null) {
      dto.JobNumber = anActivity.Job.JobNumber
      dto.JobType = anActivity.Job.Subtype
    }

    dto.CanReassign = anActivity.canAssign()
    dto.CanComplete =  anActivity.Status == typekey.ActivityStatus.TC_OPEN && anActivity.canComplete()
                          &&(anActivity.AssignedUser == User.util.CurrentUser
                              || (perm.System.acteditunowned && anActivity.AssignedUser == null)
                              ||  perm.Activity.approveany)
    dto.CanUserView = perm.Activity.view(anActivity)
    dto.CanUserViewAccount = anActivity.Account != null ? perm.Account.view(anActivity.Account) : false
    dto.CanUserViewPolicy = anActivity.Policy != null ? perm.PolicyPeriod.view(anActivity.Policy.LatestPeriod) : false
    dto.Notes = _notePlugin.getNotesForActivity(anActivity)
    dto.ChangeReason = anActivity.ChangeReason_ACC
    return dto
  }

  override function toDTOArray(activities: Activity[]): ActivityDTO[] {
    if(activities != null && activities.HasElements){
      return activities.map( \ anAct -> toDTO(anAct))
    }
    return new ActivityDTO[]{}
  }

  override function updateActivity(anActivity: Activity, dto: ActivityDTO) {
    updateBaseProperties(anActivity, dto)
  }

  override function assignableQueueToDTO(anAssignableQueue: AssignableQueue): AssignableQueueDTO {
    final var dto = new AssignableQueueDTO()
    dto.DisplayName = anAssignableQueue.DisplayName
    dto.Name = anAssignableQueue.Name

    return dto
  }

  override function markActivityAsCompleted(anActivity: Activity) {
    if(anActivity == null){
      throw new IllegalArgumentException("Activity must not be null.")
    }
    anActivity.complete()
  }

  override function createActivityForAccount(anAccount: Account, dto: ActivityDTO): Activity {
    final var anActPattern = _activityPatternPlugin.getActivityPatternByCode(dto.ActivityPattern.Code)
    final var anActivity = anAccount.newActivity(anActPattern)
    updateBaseProperties(anActivity, dto)
    anActivity.Status = typekey.ActivityStatus.TC_OPEN

    return anActivity
  }

  override function createActivityForPolicy(aPolicy: Policy, dto: ActivityDTO): Activity {
    final var bundle = Bundle.getCurrent()
    final var anActPattern = _activityPatternPlugin.getActivityPatternByCode(dto.ActivityPattern.Code)
    final var anActivity = anActPattern.createPolicyActivity( bundle.PlatformBundle, aPolicy, null, null, null, null, null, null, null )
    updateBaseProperties(anActivity, dto)
    anActivity.setFieldValue("PreviousUser", User.util.CurrentUser)
    anActivity.Status = typekey.ActivityStatus.TC_OPEN

    return anActivity
  }

  override function createActivityForJob(aJob: Job, dto: ActivityDTO): Activity {
    final var bundle = Bundle.getCurrent()
    final var anActPattern = _activityPatternPlugin.getActivityPatternByCode(dto.ActivityPattern.Code)
    final var anActivity = anActPattern.createJobActivity(bundle.PlatformBundle, aJob, null, null, null, null, null, null, null )
    updateBaseProperties(anActivity, dto)
    anActivity.setFieldValue("PreviousUser", User.util.CurrentUser)
    anActivity.Status = typekey.ActivityStatus.TC_OPEN

    return anActivity
  }

  override function getAssignableUserForActivity(entity : Object, anActPattern: ActivityPattern): ActivityDTO {
    final var bundle = Bundle.getCurrent()

    if (entity typeis Account) {
      final var anActivity = entity.newActivity(anActPattern)
      final var dto = toDTO(anActivity)
      bundle.delete(anActivity)

      return dto
    }else if (entity typeis Policy) {
      final var anActivity = anActPattern.createPolicyActivity(bundle.PlatformBundle, entity, null, null, null, null, null, null, null)
      final var dto = toDTO(anActivity)
      bundle.delete(anActivity)

      return dto
    }else if (entity typeis Job) {
      final var anActivity = anActPattern.createJobActivity(bundle.PlatformBundle, entity, null, null, null, null, null, null, null)
      final var dto = toDTO(anActivity)
      bundle.delete(anActivity)

      return dto
    }

    return null
  }

  public static function fillBaseProperties(dto : ActivityDTO, anActivity : Activity){
    dto.PublicID = anActivity.PublicID
    dto.DueDate = anActivity.TargetDate
    dto.Priority = anActivity.Priority
    dto.PriorityValue = anActivity.Priority.Ordinal
    dto.Subject = anActivity.Subject
    dto.AccountHolderName = anActivity.UIDisplayName
    dto.AccountNumber = anActivity.Account.AccountNumber
    dto.Status = anActivity.Status
    dto.CloseDate = anActivity.CloseDate
    dto.CreatedDate = anActivity.CreateTime
    dto.Description = anActivity.Description
    dto.CompletedDate = anActivity.CloseDate
    dto.Recurring = anActivity.Recurring
    dto.Mandatory = anActivity.Mandatory
  }

  public static function updateBaseProperties(anActivity : Activity, dto : ActivityDTO){
    anActivity.TargetDate = dto.DueDate
    anActivity.EscalationDate = dto.EscalationDate
    anActivity.Priority = dto.Priority
    anActivity.Subject = dto.Subject
    anActivity.AssignedByUser = User.util.CurrentUser
    anActivity.Description = dto.Description
  }

  protected function getAssignedTo(anActivity: Activity): Object {
    if (anActivity.AssignedUser != null) {
      return _userPlugin.toDTO(anActivity.AssignedUser)

    } else if (anActivity.AssignedQueue != null) {
      return assignableQueueToDTO(anActivity.AssignedQueue)

    } else if (anActivity.AssignedGroup != null) {
      var dto = new AssignableGroupDTO()
      dto.Name = anActivity.AssignedGroup.Name
      dto.DisplayName = anActivity.AssignedGroup.DisplayName
      return dto

    } else {
      return null
    }
  }

  protected function getAssignableUsers(anActivity: Activity): String[] {
    var assigneePopup = new gw.api.web.activity.ActivityAssignmentPopup(new Activity[]{anActivity}, gw.assignment.AssignmentUtil.DefaultUser)
    var assignees = new String[assigneePopup.SuggestedAssignees.Count]
    assigneePopup.SuggestedAssignees.eachWithIndex(\assignee, i -> {
      assignees[i] = assignee.toString()
    })

    return assignees
  }

}