package edge.capabilities.gpa.job.policychange

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.gpa.job.JobHandler
uses edge.capabilities.helpers.JobUtil
uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.gpa.note.dto.NoteDTO
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.capabilities.gpa.document.IDocumentPlugin
uses java.lang.Exception
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.gpa.job.IUWIssuePlugin
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses edge.capabilities.gpa.job.dto.JobSummaryDTO
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.PlatformSupport.Bundle
uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeDTO
uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeSummaryDTO

class PolicyChangeHandler extends JobHandler implements IRpcHandler {
  private static final var LOGGER = new Logger(Reflection.getRelativeName(PolicyChangeHandler))
  var _jobPlugin: IJobPlugin
  var _policyChangePlugin: IPolicyChangePlugin
  var _policyChangeSummaryPlugin : IPolicyChangeSummaryPlugin
  var _notePlugin: INotePlugin
  var _documentPlugin: IDocumentPlugin
  var _jobHelper: JobUtil
  var _uwIssuePlugin: IUWIssuePlugin
  var _jobSummaryPlugin: IJobSummaryPlugin
  var _accountRetrievalPlugin: IAccountRetrievalPlugin
  
  @InjectableNode
  construct(aJobPlugin: IJobPlugin, aPolicyChangePlugin: IPolicyChangePlugin, aPolicyChangeSummaryPlugin : IPolicyChangeSummaryPlugin, aNotePlugin: INotePlugin, aDocumentPlugin: IDocumentPlugin,
            aJobHelper: JobUtil, aUWIssuePlugin: IUWIssuePlugin, aJobSummaryPlugin: IJobSummaryPlugin, anAccountRetrievalPlugin: IAccountRetrievalPlugin) {
    super(aJobPlugin, aJobHelper)

    this._jobPlugin = aJobPlugin
    this._policyChangePlugin = aPolicyChangePlugin
    this._policyChangeSummaryPlugin = aPolicyChangeSummaryPlugin
    this._notePlugin = aNotePlugin
    this._documentPlugin = aDocumentPlugin
    this._jobHelper = aJobHelper
    this._uwIssuePlugin = aUWIssuePlugin
    this._jobSummaryPlugin = aJobSummaryPlugin
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
  }


  /**
   * Finds a policyChange job by number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve a PolicyChange Job</dd>
   * <dd> <code>IPolicyChangePlugin#toDTO(PolicyChange)</code> - To serialize the resulting policyChange</dd>
   * </dl>
   * @param   jobNumber   A string Job Number
   * @returns A PolicyChangeDTO: serialized policyChange if successfully retrieved, empty otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function findJobByJobNumber(jobNumber: String): PolicyChangeDTO {
    try {
      final var aPolicyChange = _jobHelper.findJobByJobNumber(jobNumber) as PolicyChange

      return _policyChangePlugin.toDTO(aPolicyChange)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new PolicyChangeDTO()
  }

  /**
   * Get a PolicyChange summary
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve a PolicyChange Job</dd>
   * <dd> <code>IPolicyChangePlugin#toDTO(PolicyChange)</code> - To serialize the resulting policyChange</dd>
   * </dl>
   * @param   jobNumber   A string Job Number
   * @returns A PolicyChangeSummaryDTO: serialized policyChange if successfully retrieved, empty otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function getPolicyChangeSummary(jobNumber: String): PolicyChangeSummaryDTO {
    try {
      final var aPolicyChange = _jobHelper.findJobByJobNumber(jobNumber) as PolicyChange
      return _policyChangeSummaryPlugin.toDTO(aPolicyChange)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new PolicyChangeSummaryDTO()
  }

  /**
   * Retrieve PolicyChange created by current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobsByJobTypeAndCreateUser(typekey.Job, entity.User)</code> - to retrieve PolicyChanges made by current user</dd>
   * <dd> <code>IPolicyChangePlugin#toDTOArray(PolicyChange[])</code> - To serialize the PolicyChanges</dd>
   * </dl>
   * @returns PolicyChangeDTO array: serialized PolicyChanges if successfully retrieved, empty array otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findPolicyChangesByCreateUser(): PolicyChangeDTO[] {
    try {
      final var policyChanges = _jobHelper.findJobsByJobTypeAndCreateUser(typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser).whereTypeIs(PolicyChange)

      return _policyChangePlugin.toDTOArray(policyChanges)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new PolicyChangeDTO[]{}
  }

  /**
   * Retrieve policyChanges created by current user within given number of days
   *
   *  <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(typekey.Job, entity.User, int)</code> - To retrieve PolicyChanges made by current user for the last X days</dd>
   * <dd> <code>IPolicyChangePlugin#toDTOArray(PolicyChange[])</code> - To serialize the PolicyChanges</dd>
   * </dl>
   * @param   numberOfDays  Integer number of days
   * @returns PolicyChangeDTO array: serialized policyChanges if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findPolicyChangeByCreateUserOpenedWithinNumberOfDays(numberOfDays: int): PolicyChangeDTO[] {
    try {
      final var policyChanges = _jobHelper.findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser, numberOfDays).whereTypeIs(PolicyChange)

      return _policyChangePlugin.toDTOArray(policyChanges)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new PolicyChangeDTO[]{}
  }

  /**
   * Get PolicyChanges by the Account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To retrieve jobs for an Account</dd>
   * <dd> <code>IPolicyChangePlugin#toDTOArray(PolicyChange[])</code> - To serialize the PolicyChanges</dd>
   * </dl>
   * @param   accountNumber String Account number
   * @returns PolicyChangeDTO array: serialized policyChanges if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findPolicyChangesByAccount(accountNumber: String): PolicyChangeDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var policyChanges = _jobHelper.findJobsByAccount(account, null, typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser).whereTypeIs(PolicyChange)

      return _policyChangePlugin.toDTOArray(policyChanges)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new PolicyChangeDTO[]{}
  }

  /**
   * Get PolicyChange summaries by the Account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To retrieve jobs for an Account</dd>
   * <dd> <code>IJobSummaryPlugin#toDTOArray(entity.Job[])</code> - To serialize the Jobs</dd>
   * </dl>
   * @param   accountNumber String Account number
   * @returns JobSummaryDTO array: serialized policyChanges if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findPolicyChangeSummariesByAccount(accountNumber: String): JobSummaryDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var policyChanges = _jobHelper.findJobsByAccount(account, null, typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser)

      return _jobSummaryPlugin.toDTOArray(policyChanges)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new JobSummaryDTO[]{}
  }

  /**
   * Returns notes related to a given policyChange.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a PolicyChange Job</dd>
   * <dd> <code>INotePlugin#getNotesForJob(entity.Job)</code> - To retrieve PolicyChange notes</dd>
   * </dl>
   * @param   policyChangeNumber  String PolicyChange number
   * @returns NoteDTO array: Notes relating to the policyChange.
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getNotesForPolicyChange(policyChangeNumber: String): NoteDTO[] {
    try {
      final var policyChange = _jobHelper.findJobByJobNumber(policyChangeNumber)

      return _notePlugin.getNotesForJob(policyChange)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new NoteDTO[]{}
  }

  /**
   * Returns UW Issues related to a given policyChange.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a PolicyChange Job</dd>
   * <dd> <code>IPolicyChangePlugin#getUWIssuesForPolicyChange(entity.PolicyChange)</code> - To retrieve PolicyChange UW issues</dd>
   * </dl>
   * @param   policyChangeNumber  String PolicyChange number
   * @returns UWIssueDTO array: Underwriting Issues on the current PolicyChange.
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getUWIssuesForPolicyChange(policyChangeNumber: String): UWIssueDTO[] {
    try {
      final var policyChange = _jobHelper.findJobByJobNumber(policyChangeNumber) as PolicyChange
      return _policyChangePlugin.getUWIssuesForPolicyChange(policyChange)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new UWIssueDTO[]{}
  }

  /**
   * Creates a Note for an PolicyChange.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a PolicyChange Job</dd>
   * <dd> <code>INotePlugin#createNoteForJob(entity.Job, NoteDTO)</code> - To create a new Note</dd>
   * </dl>
   * @param policyChangeNumber the policyChange number
   * @param noteDTO The note to be created
   * @return A serialized version of the new Note
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNoteForPolicyChange(policyChangeNumber: String, noteDTO: NoteDTO): NoteDTO {
    final var note = Bundle.resolveInTransaction( \ bundle -> {
      final var policyChange = bundle.add(_jobHelper.findJobByJobNumber(policyChangeNumber))
      return _notePlugin.createNoteForJob(policyChange, noteDTO)
    })

    return _notePlugin.toDTO(note)
  }

  /**
   * Returns documents related to a given policyChange.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a PolicyChange Job</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForJob(entity.Job)</code> - To retrieve related Documents</dd>
   * </dl>
   * @param   policyChangeNumber the policyChange number
   * @returns DocumentDTO array
   *
   */
  @Returns("Documents relating to the policyChange.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getDocumentsForPolicyChange(policyChangeNumber: String): DocumentDTO[] {
    try {
      final var policyChange = _jobHelper.findJobByJobNumber(policyChangeNumber)
      final var documents = _documentPlugin.getDocumentsForJob(policyChange)

      return _documentPlugin.toDTOArray(documents)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new DocumentDTO[]{}
  }


  /**
   * Returns documents related to a given policyChange.
   *
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a PolicyChange Job</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForJob(entity.Job)</code> - To retrieve related Documents</dd>
   * </dl>
   * @param   policyChangeNumber the policyChange number
   * @param   noteForUnderwriter an optional note for the underwriter
   * @returns PolicyChangeDTO
   *
   */
  @Returns("PolicyChange after being refered to underwriter.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function referToUnderwriter(policyChangeNumber: String, noteForUnderwriter: String): PolicyChangeDTO {
    try {
      var policyChange = _jobHelper.findJobByJobNumber(policyChangeNumber) as PolicyChange
      _policyChangePlugin.referToUnderwriter(policyChange, noteForUnderwriter)
      return _policyChangePlugin.toDTO(policyChange)
    }
    catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new PolicyChangeDTO()
  }
}
