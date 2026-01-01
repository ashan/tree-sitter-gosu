package edge.capabilities.gpa.job.cancellation

uses edge.capabilities.gpa.job.JobHandler
uses edge.jsonrpc.IRpcHandler
uses edge.capabilities.helpers.JobUtil
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses java.util.Date
uses edge.capabilities.helpers.PolicyUtil
uses edge.di.annotations.InjectableNode
uses edge.capabilities.gpa.job.cancellation.dto.CancellationDTO
uses edge.capabilities.gpa.job.IJobPlugin
uses java.lang.Exception
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.capabilities.gpa.job.cancellation.dto.CancellationSummaryDTO
uses edge.capabilities.gpa.job.dto.JobSummaryDTO
uses edge.capabilities.gpa.note.dto.NoteDTO
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses edge.PlatformSupport.Bundle
uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.job.IUWIssuePlugin
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin

class CancellationHandler extends JobHandler implements IRpcHandler {

  private static final var LOGGER = new Logger(Reflection.getRelativeName(CancellationHandler))
  var _jobPlugin : IJobPlugin
  var _cancellationPlugin : ICancellationPlugin
  var _jobHelper : JobUtil
  var _policyHelper : PolicyUtil
  var _cancellationSummaryPlugin : ICancellationSummaryPlugin
  var _notePlugin: INotePlugin
  var _documentPlugin: IDocumentPlugin
  var _uwIssuePlugin: IUWIssuePlugin
  var _jobSummaryPlugin: IJobSummaryPlugin
  var _accountRetrievalPlugin: IAccountRetrievalPlugin

  @InjectableNode
  construct(aJobPlugin : IJobPlugin, aCancellationPlugin : ICancellationPlugin, aJobHelper : JobUtil, aPolicyHelper : PolicyUtil,
    aCancellationSummaryPlugin : ICancellationSummaryPlugin, aNotePlugin : INotePlugin, aDocumentPlugin : IDocumentPlugin, anUWIssuePlugin : IUWIssuePlugin,
    aJobSummaryPlugin : IJobSummaryPlugin, anAccountRetrievalPlugin : IAccountRetrievalPlugin){
    super(aJobPlugin, aJobHelper)

    this._jobPlugin = aJobPlugin
    this._cancellationPlugin = aCancellationPlugin
    this._jobHelper = aJobHelper
    this._policyHelper = aPolicyHelper
    this._cancellationSummaryPlugin = aCancellationSummaryPlugin
    this._notePlugin = aNotePlugin
    this._documentPlugin = aDocumentPlugin
    this._uwIssuePlugin = anUWIssuePlugin
    this._jobSummaryPlugin = aJobSummaryPlugin
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
  }


  /**
   * Get refund calculation methods applicable to the given policy under given cancellation job details.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>PolicyUtil#getPolicyByPolicyNumber(java.lang.String)</code> - To retrieve a Policy by its PolicyNumber</dd>
   * <dd> <code>ICancellationPlugin#getValidRefundMethods(Policy, CancellationDTO)</code> - To retrieve the refund methods</dd>
   * </dl>
   * @param   policyNumber      A string Policy Number to search the policy by
   * @param   tempCancellation  Temporary Cancellation job details
   * @returns a list of CalculationMethods
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getValidRefundMethods(policyNumber: String, tempCancellation : CancellationDTO): CalculationMethod[] {
    var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)

    return _cancellationPlugin.getValidRefundMethods(policy, tempCancellation)
  }

  /**
   * Get a default effective cancellation date.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>PolicyUtil#getPolicyByPolicyNumber(java.lang.String)</code> - To retrieve a Policy by its PolicyNumber</dd>
   * <dd> <code>ICancellationPlugin#getEffectiveDateForCancellation(Policy, CancellationDTO)</code> - To calculate the default effective date</dd>
   * </dl>
   * @param   policyNumber      Policy Number string
   * @param   tempCancellation  Temporary Cancellation job details
   * @returns An effective date for a cancellation
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getEffectiveDateForCancellation(policyNumber: String, tempCancellation : CancellationDTO): Date {
    var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)

    return _cancellationPlugin.getEffectiveDateForCancellation(policy, tempCancellation)
  }

  /**
   * Finds a cancellation job by number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve a Cancellation Job</dd>
   * <dd> <code>ICancellationPlugin#toDTO(Cancellation)</code> - To serialize the resulting cancellation</dd>
   * </dl>
   * @param   jobNumber   A string Job Number
   * @returns A CancellationDTO: serialized cancellation if successfully retrieved, empty otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function findJobByJobNumber(jobNumber: String): CancellationDTO {
    try {
      final var aCancellation = _jobHelper.findJobByJobNumber(jobNumber) as Cancellation

      return _cancellationPlugin.toDTO(aCancellation)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new CancellationDTO()
  }

  /**
   * Get a Cancellation summary
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve a Cancellation Job</dd>
   * <dd> <code>ICancellationPlugin#toDTO(Cancellation)</code> - To serialize the resulting cancellation</dd>
   * </dl>
   * @param   jobNumber   A string Job Number
   * @returns A CancellationSummaryDTO: serialized cancellation if successfully retrieved, empty otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function getCancellationSummary(jobNumber: String): CancellationSummaryDTO {
    try {
      final var aCancellation = _jobHelper.findJobByJobNumber(jobNumber) as Cancellation
      return _cancellationSummaryPlugin.toDTO(aCancellation)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new CancellationSummaryDTO()
  }

  /**
   * Retrieve Cancellation created by current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobsByJobTypeAndCreateUser(typekey.Job, entity.User)</code> - to retrieve Cancellations made by current user</dd>
   * <dd> <code>ICancellationPlugin#toDTOArray(Cancellation[])</code> - To serialize the Cancellations</dd>
   * </dl>
   * @returns CancellationDTO array: serialized Cancellations if successfully retrieved, empty array otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findCancellationsByCreateUser(): CancellationDTO[] {
    try {
      final var cancellations = _jobHelper.findJobsByJobTypeAndCreateUser(typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser).whereTypeIs(Cancellation)

      return _cancellationPlugin.toDTOArray(cancellations)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new CancellationDTO[]{}
  }

  /**
   * Retrieve cancellations created by current user within given number of days
   *
   *  <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(typekey.Job, entity.User, int)</code> - To retrieve Cancellations made by current user for the last X days</dd>
   * <dd> <code>ICancellationPlugin#toDTOArray(Cancellation[])</code> - To serialize the Cancellations</dd>
   * </dl>
   * @param   numberOfDays  Integer number of days
   * @returns CancellationDTO array: serialized cancellations if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findCancellationByCreateUserOpenedWithinNumberOfDays(numberOfDays: int): CancellationDTO[] {
    try {
      final var cancellations = _jobHelper.findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser, numberOfDays).whereTypeIs(Cancellation)

      return _cancellationPlugin.toDTOArray(cancellations)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new CancellationDTO[]{}
  }

  /**
   * Get Cancellations by the Account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To retrieve jobs for an Account</dd>
   * <dd> <code>ICancellationPlugin#toDTOArray(Cancellation[])</code> - To serialize the Cancellations</dd>
   * </dl>
   * @param   accountNumber String Account number
   * @returns CancellationDTO array: serialized cancellations if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findCancellationsByAccount(accountNumber: String): CancellationDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var cancellations = _jobHelper.findJobsByAccount(account, null, typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser).whereTypeIs(Cancellation)

      return _cancellationPlugin.toDTOArray(cancellations)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new CancellationDTO[]{}
  }

  /**
   * Get Cancellation summaries by the Account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To retrieve jobs for an Account</dd>
   * <dd> <code>IJobSummaryPlugin#toDTOArray(entity.Job[])</code> - To serialize the Jobs</dd>
   * </dl>
   * @param   accountNumber String Account number
   * @returns JobSummaryDTO array: serialized cancellations if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findCancellationSummariesByAccount(accountNumber: String): JobSummaryDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var cancellations = _jobHelper.findJobsByAccount(account, null, typekey.Job.TC_POLICYCHANGE, User.util.CurrentUser)

      return _jobSummaryPlugin.toDTOArray(cancellations)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new JobSummaryDTO[]{}
  }

  /**
   * Returns notes related to a given cancellation.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Cancellation Job</dd>
   * <dd> <code>INotePlugin#getNotesForJob(entity.Job)</code> - To retrieve Cancellation notes</dd>
   * </dl>
   * @param   cancellationNumber  String Cancellation number
   * @returns NoteDTO array: Notes relating to the cancellation.
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getNotesForCancellation(cancellationNumber: String): NoteDTO[] {
    try {
      final var cancellation = _jobHelper.findJobByJobNumber(cancellationNumber)

      return _notePlugin.getNotesForJob(cancellation)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new NoteDTO[]{}
  }

  /**
   * Returns UW Issues related to a given cancellation.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Cancellation Job</dd>
   * <dd> <code>ICancellationPlugin#getUWIssuesForCancellation(entity.Cancellation)</code> - To retrieve Cancellation UW issues</dd>
   * </dl>
   * @param   cancellationNumber  String Cancellation number
   * @returns UWIssueDTO array: Underwriting Issues on the current Cancellation.
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getUWIssuesForCancellation(cancellationNumber: String): UWIssueDTO[] {
    try {
      final var cancellation = _jobHelper.findJobByJobNumber(cancellationNumber) as Cancellation
      return _cancellationPlugin.getUWIssuesForCancellation(cancellation)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new UWIssueDTO[]{}
  }

  /**
   * Creates a Note for an Cancellation.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Cancellation Job</dd>
   * <dd> <code>INotePlugin#createNoteForJob(entity.Job, NoteDTO)</code> - To create a new Note</dd>
   * </dl>
   * @param cancellationNumber the cancellation number
   * @param noteDTO The note to be created
   * @return A serialized version of the new Note
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNoteForCancellation(cancellationNumber: String, noteDTO: NoteDTO): NoteDTO {
    final var note = Bundle.resolveInTransaction( \ bundle -> {
      final var cancellation = bundle.add(_jobHelper.findJobByJobNumber(cancellationNumber))
      return _notePlugin.createNoteForJob(cancellation, noteDTO)
    })

    return _notePlugin.toDTO(note)
  }

  /**
   * Returns documents related to a given cancellation.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Cancellation Job</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForJob(entity.Job)</code> - To retrieve related Documents</dd>
   * </dl>
   * @param   cancellationNumber the cancellation number
   * @returns DocumentDTO array
   *
   */
  @Returns("Documents relating to the cancellation.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getDocumentsForCancellation(cancellationNumber: String): DocumentDTO[] {
    try {
      final var cancellation = _jobHelper.findJobByJobNumber(cancellationNumber)
      final var documents = _documentPlugin.getDocumentsForJob(cancellation)

      return _documentPlugin.toDTOArray(documents)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new DocumentDTO[]{}
  }


  /**
   * Returns documents related to a given cancellation.
   *
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Cancellation Job</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForJob(entity.Job)</code> - To retrieve related Documents</dd>
   * </dl>
   * @param   cancellationNumber the cancellation number
   * @param   noteForUnderwriter an optional note for the underwriter
   * @returns CancellationDTO
   *
   */
  @Returns("Cancellation after being refered to underwriter.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function referToUnderwriter(cancellationNumber: String, noteForUnderwriter: String): CancellationDTO {
    try {
      var cancellation = _jobHelper.findJobByJobNumber(cancellationNumber) as Cancellation
      _cancellationPlugin.referToUnderwriter(cancellation, noteForUnderwriter)
      return _cancellationPlugin.toDTO(cancellation)
    }
        catch (ex: Exception) {
          LOGGER.logError(ex)
        }

    return new CancellationDTO()
  }

  /**
   * Returns a cancellation after it has been bound.
   *
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Cancellation Job</dd>
   * <dd> <code>ICancellationPlugin#bindCancellation(entity.Cancellation)</code> - To bind a Cancellation Job</dd>
   * </dl>
   * @param   cancellationNumber the cancellation number
   * @returns CancellationDTO
   *
   */
  @Returns("Cancellation after it has been bound.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function bindCancellation(cancellationNumber: String): CancellationDTO {
    try {
      var cancellation = _jobHelper.findJobByJobNumber(cancellationNumber) as Cancellation
      _cancellationPlugin.bindCancellation(cancellation)
      return _cancellationPlugin.toDTO(cancellation)
    } catch (ex: Exception) {
        LOGGER.logError(ex)
    }

    return new CancellationDTO()
  }

  /**
   * Withdraw a cancellation by its job number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve job by job number</dd>
   * </dl>
   * @param   jobNumber   Job Number string
   * @returns CancellationDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function withdrawCancellationByJobNumber(jobNumber : String) : CancellationDTO{
    var bundle = Bundle.getCurrent()
    var cancellation = bundle.add(_jobHelper.findJobByJobNumber(jobNumber) as Cancellation)
    cancellation.LatestPeriod.JobProcess.withdrawJob()

    return _cancellationPlugin.toDTO(cancellation)
  }
}
