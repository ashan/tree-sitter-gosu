package edge.capabilities.gpa.activity

uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.gpa.account.IAccountPlugin
uses edge.capabilities.gpa.account.search.IAccountSearchPlugin
uses edge.capabilities.gpa.job.submission.ISubmissionPlugin
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.helpers.ActivityUtil
uses edge.capabilities.helpers.PolicyUtil
uses edge.capabilities.gpa.note.dto.NoteDTO
uses edge.exception.IllegalStateException
uses edge.capabilities.gpa.activity.dto.ActivityPatternDTO
uses gw.api.assignment.Assignee
uses edge.PlatformSupport.Bundle
uses java.lang.Exception
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.exception.EntityNotFoundException
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.PlatformSupport.Bundle

class ActivityHandler implements IRpcHandler {
  final private static  var LOGGER = new Logger(Reflection.getRelativeName(ActivityHandler))
  private var _activityHelper: ActivityUtil
  private var _policyHelper: PolicyUtil
  private var _jobHelper: JobUtil
  protected var _activityPlugin: IActivityPlugin
  private var _notePlugin: INotePlugin
  private var _activityPatternPlugin: IActivityPatternPlugin
  private var _accountRetrievalPlugin: IAccountRetrievalPlugin
  @InjectableNode
  construct(anActivityPlugin: IActivityPlugin, notePlugin: INotePlugin, anActivityPatternPlugin: IActivityPatternPlugin,
            anActivityHelper: ActivityUtil, aPolicyHelper: PolicyUtil, aJobHelper: JobUtil,
            anAccountRetrievalPlugin: IAccountRetrievalPlugin) {
    this._activityPlugin = anActivityPlugin
    this._notePlugin = notePlugin
    this._activityPatternPlugin = anActivityPatternPlugin
    this._activityHelper = anActivityHelper
    this._policyHelper = aPolicyHelper
    this._jobHelper = aJobHelper
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
  }

  /**
   * Gets an activity given its Public ID
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivityFromPublicID(java.lang.String)</code> - To return an activity with the given Public ID</dd>
   * <dd> <code>IActivityPlugin#toDTO(entity.Activity)</code> - To generate a DTO of the Activity </dd>
   * </dl>
   * @param  publicID The ID of the activity to be returned
   * @return     An ActivityDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivity(publicID: String): ActivityDTO {
    try {
      final var activity = _activityHelper.getActivityFromPublicID(publicID)

      return _activityPlugin.toDTO(activity)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new ActivityDTO()
  }

  /**
   * Gets all activities for the currently logged in User
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivitiesForCurrentUser(java.lang.String)</code> - To return a list of activities for the currently logged in user</dd>
   * </dl>
   * @return     An array of ActivityDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivitiesForUser(): ActivityDTO[] {
    try {
      final var activities = _activityHelper.getActivitiesForCurrentUser()
      return activitiesToDTOArray(activities?.toTypedArray())
    }catch(ex : EntityNotFoundException){
      if(LOGGER.debugEnabled()){
        LOGGER.logError(ex)
      } else {
        LOGGER.logError(ex.LocalizedMessage)
      }
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new ActivityDTO[]{}
  }

  /**
   * Gets the activities for the Policy with the given policy number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivitiesForPolicy(Policy)</code> - To retrieve the activities on from the policy</dd>
   * <dd> <code>PolicyUtil#getPolicyByPolicyNumber(java.lang.String)</code> - To retrieve the policy with the given policy number</dd>
   * </dl>
   * @param      policyNumber The ID of the policy from which the activities are to be returned
   * @return     An array of ActivityDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivitiesForPolicy(policyNumber: String): ActivityDTO[] {
    try {
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)
      final var activities = _activityHelper.getActivitiesForPolicy(policy)

      return activitiesToDTOArray(activities?.toTypedArray())
    }catch(ex : EntityNotFoundException){
      if(LOGGER.debugEnabled()){
        LOGGER.logError(ex)
      } else {
        LOGGER.logError(ex.LocalizedMessage)
      }
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new ActivityDTO[]{}
  }

  /**
   * Gets the activities for the Job with the given job number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivitiesForJob(java.lang.String)</code> - To retrieve the activities on from the job</dd>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve the job with the given job number</dd>
   * </dl>
   * @param      jobNumber The ID of the job from which the activities are to be returned
   * @return     An array of ActivityDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivitiesForJob(jobNumber: String): ActivityDTO[] {
    try {
      final var job = _jobHelper.findJobByJobNumber(jobNumber)
      final var activities = _activityHelper.getActivitiesForJob(job)

      return activitiesToDTOArray(activities?.toTypedArray())
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new ActivityDTO[]{}
  }

  /**
   * Gets the activities for the Account with the given account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the account with the given account number</dd>
   * <dd> <code>ActivityUtil#getActivitiesForAccount(Account)</code> - To retrieve the activities on from the Account</dd>
   * </dl>
   * @param      accountNumber The ID of the account from which the activities are to be returned
   * @return     An array of ActivityDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivitiesForAccount(accountNumber: String): ActivityDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var activities = _activityHelper.getActivitiesForAccount(account)

      return activitiesToDTOArray(activities?.toTypedArray())
    }catch(ex : EntityNotFoundException){
      if(LOGGER.debugEnabled()){
        LOGGER.logError(ex)
      } else {
        LOGGER.logError(ex.LocalizedMessage)
      }
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new ActivityDTO[]{}
  }

  /**
   * Gets the activities for the Account with the given account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivityFromPublicID(java.lang.String)</code> - To retrieve the activities on from the Account</dd>
   * <dd> <code>IActivityPlugin#markActivityAsCompleted(Activity)</code> - To retrieve the account with the given account number</dd>
   * <dd> <code>IActivityPlugin#toDTO(Activity)</code> - To map the activity to an ActivityDTO</dd>
   * </dl>
   * @param      publicID The ID of the activity to be marked as complete
   * @return     An ActivityDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function markActivityAsCompleted(publicID: String): ActivityDTO {
    try {
      var bundle = Bundle.getCurrent()
      var activity = bundle.add(_activityHelper.getActivityFromPublicID(publicID))

      _activityPlugin.markActivityAsCompleted(activity)

      return _activityPlugin.toDTO(activity)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new ActivityDTO()
  }

  /**
   * Gets the Notes for the Activity with the given activity number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivityFromPublicID(java.lang.String)</code> - To retrieve the activities on from the Account</dd>
   * <dd> <code>INotePlugin#getNotesForActivity(Activity)</code> - To retrieve the notes associated with the activity</dd>
   * </dl>
   * @param      publicID The ID of the activity to retrieve the notes from
   * @return     An array of NoteDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getNotesForActivity(publicID: String): NoteDTO[] {
    final var activity = _activityHelper.getActivityFromPublicID(publicID)

    return _notePlugin.getNotesForActivity(activity)
  }

  /**
   * Creates a Note for an Activity.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivityFromPublicID(java.lang.String)</code> - To retrieve the activities on from the Account</dd>
   * <dd> <code>INotePlugin#createNoteForActivity(Activity, NoteDTO)</code> - to create a note on the activity with the given NoteDTO</dd>
   * </dl>
   * @param      publicID The ID of the activity to create a note on
   * @param      noteDTO The details of the note to be created
   * @return     A NoteDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNoteForActivity(publicID: String, noteDTO: NoteDTO): NoteDTO {
    var note = Bundle.resolveInTransaction( \ bundle -> {
      final var activity = bundle.add(_activityHelper.getActivityFromPublicID(publicID))
      if (activity.Status != ActivityStatus.TC_OPEN) {
        throw new IllegalStateException(){
            : Message = "Notes can't be attached to closed/skipped/cancelled activities",
            : Data = activity.Status
        }
      }

      return _notePlugin.createNoteForActivity(activity, noteDTO)
    })

    return _notePlugin.toDTO(note)
  }

  /**
   * Get ActivityPatterns for accounts, policies, or jobs
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IActivityPatternPlugin#getActivityPatternsForEntity(java.lang.String)</code> - To retrieve the activity patterns for the given entity</dd>
   * <dd> <code>ActivityPatternDTO#toDTOArray(ActivityPattern[])</code> - To return an array of ActivityPatternDTO</dd>
   * </dl>
   * @param      actPatternEntity The entity to return the activity patterns from
   * @return     An array of ActivityPatternDTO array
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivityPatternsFor(actPatternEntity: String): ActivityPatternDTO[] {
    final var allActPatterns = _activityPatternPlugin.getActivityPatternsForEntity(actPatternEntity)

    if (allActPatterns.HasElements){
      return _activityPatternPlugin.toDTOArray(allActPatterns.where(\actPattern -> !actPattern.AutomatedOnly))
    }

    return new ActivityPatternDTO[]{}
  }

  /**
   * Creates a new Activity
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>INotePlugin#createNoteForActivity(Activity, NoteDTO)</code> - To create a note on the activity with the given NoteDTO</dd>
   * <dd> <code>IActivityPlugin#toDTO(Activity)</code> - To return an ActivityDTO</dd>
   * </dl>
   * @param      anActivityDTO The Activity to be created
   * @param      aNoteDTO A note to be created and assigned to the new Activity
   * @return     An ActivityDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNewActivity(anActivityDTO: ActivityDTO, aNoteDTO: NoteDTO): ActivityDTO {
    final var anActivity = Bundle.resolveInTransaction(\bundle -> {
      var activity = createActivity(anActivityDTO, bundle)

      if (activity != null){
        final var assignee = getAssignableUsers(activity).firstWhere(\anAssignee -> anAssignee.toString().equalsIgnoreCase(anActivityDTO.SelectedAssignee))

        if (aNoteDTO != null && aNoteDTO.Subject.trim().HasContent){
          _notePlugin.createNoteForActivity(activity, aNoteDTO)
        }
        if (assignee != null){
          assignee.assignToThis(activity)
        }
      }
      return activity
    })
    if (anActivity != null){

      return _activityPlugin.toDTO(anActivity)
    }

    return new ActivityDTO()
  }

  /**
   * Get assignable users for an Activity
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IActivityPlugin#getAssignableUserForActivity(Object, ActivityPattern)</code> - To return ActivityDTO with assignable users</dd>
   * </dl>
   * @param      actPatternEntity Entity Name
   * @param      anActPatternDTO  Activity Pattern DTO
   * @return     An ActivityDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getAssignableUserForActivity(actPatternEntity: String, id: String, anActPatternDTO: ActivityPatternDTO): ActivityDTO {
    final var bundle = Bundle.getCurrent()
    final var anActPattern = ActivityPattern.finder.getActivityPatternByCode(anActPatternDTO.Code)
    final var actEntity = getActivityEntity(actPatternEntity, id, bundle)

    if (actEntity != null){
      return _activityPlugin.getAssignableUserForActivity(actEntity, anActPattern)
    }

    return new ActivityDTO()
  }

  /**
   * Reassigns an Activity to the specified assignee
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivityFromPublicID(java.lang.String)</code> - To retrieve the Activity</dd>
   * <dd> <code>IActivityPlugin#toDTO(Activity)</code> - To return an ActivityDTO</dd>
   * </dl>
   * @param      anActivityDTO The Activity to be created
   * @return     An ActivityDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function reassignActivity(anAssignee: String, activityPublicID: String): ActivityDTO {
    var activityDTO: ActivityDTO
    var bundle = Bundle.getCurrent()
    var anActivity = bundle.add(_activityHelper.getActivityFromPublicID(activityPublicID))
    var assignedUser = getAssignableUsers(anActivity).firstWhere(\assignee -> assignee.toString().equalsIgnoreCase(anAssignee))

    if (assignedUser != null){
      assignedUser.assignToThis(anActivity)
      return _activityPlugin.toDTO(anActivity)
    }

    return new ActivityDTO()
  }

  /**
   * Gets the activities for the currently logged in User and the groups they belong to
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>ActivityUtil#getActivitiesForCurrentUserAndGroups()</code> - To return a list of activities for the currently logged in user and the groups they belong to</dd>
   * </dl>
   * @return     An array of ActivityDTOs
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getActivitiesForCurrentUserAndGroups(): ActivityDTO[] {
    try {
      final var activities = _activityHelper.getActivitiesForCurrentUserAndGroups()
      return activitiesToDTOArray(activities?.toTypedArray())
    }catch(ex : EntityNotFoundException){
      if(LOGGER.debugEnabled()){
        LOGGER.logError(ex)
      } else {
        LOGGER.logError(ex.LocalizedMessage)
      }
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new ActivityDTO[]{}
  }

  private function activitiesToDTOArray(activities: Activity[]): ActivityDTO[] {
    if (activities != null && activities.HasElements){
      return _activityPlugin.toDTOArray(activities)
    }

    return new ActivityDTO[]{}
  }

  protected function createActivity(dto: ActivityDTO, bundle: Bundle): Activity {
    if (dto.AccountNumber != null && !dto.AccountNumber.Empty) {
      final var anAccount = bundle.add(_accountRetrievalPlugin.getAccountByNumber(dto.AccountNumber))
      return _activityPlugin.createActivityForAccount(anAccount, dto)
    } else if (dto.PolicyNumber != null && !dto.PolicyNumber.Empty) {
      final var aPolicy = _policyHelper.getPolicyByPolicyNumber(dto.PolicyNumber)
      return _activityPlugin.createActivityForPolicy(aPolicy, dto)
    } else if (dto.JobNumber != null && !dto.JobNumber.Empty) {
      final var aJob = _jobHelper.findJobByJobNumber(dto.JobNumber)
      return _activityPlugin.createActivityForJob(aJob, dto)
    }

    return null
  }

  private function getAssignableUsers(anActivity: Activity): Assignee[] {
    var assigneePopup = new gw.api.web.activity.ActivityAssignmentPopup(new Activity[]{anActivity}, gw.assignment.AssignmentUtil.DefaultUser)

    return assigneePopup.SuggestedAssignees
  }

  private function getActivityEntity(entityName: String, id: String, bundle: Bundle): Object {
    switch (entityName) {
      case "account": {
        return bundle.add(_accountRetrievalPlugin.getAccountByNumber(id))
      }
      case "policy": {
        return _policyHelper.getPolicyByPolicyNumber(id)
      }
      case "job": {
        return _jobHelper.findJobByJobNumber((id))
      }
        default: {
      break
    }
    }

    return null
  }
}
