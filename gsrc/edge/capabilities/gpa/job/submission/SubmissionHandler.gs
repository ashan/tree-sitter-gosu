package edge.capabilities.gpa.job.submission

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.gpa.job.submission.dto.NewSubmissionDTO
uses edge.capabilities.gpa.job.submission.dto.SubmissionDTO
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
uses edge.capabilities.gpa.job.submission.dto.SubmissionSummaryDTO
uses edge.capabilities.gpa.job.IUWIssuePlugin
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses edge.capabilities.gpa.job.dto.JobSummaryDTO
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses java.lang.Integer
uses edge.capabilities.gpa.account.IAccountRetrievalPlugin
uses edge.PlatformSupport.Bundle

class SubmissionHandler extends JobHandler implements IRpcHandler {
  private static final var LOGGER = new Logger(Reflection.getRelativeName(SubmissionHandler))
  var _jobPlugin: IJobPlugin
  var _submissionPlugin: ISubmissionPlugin
  var _submissionSummaryPlugin: ISubmissionSummaryPlugin
  var _notePlugin: INotePlugin
  var _documentPlugin: IDocumentPlugin
  var _jobHelper: JobUtil
  var _uwIssuePlugin: IUWIssuePlugin
  var _jobSummaryPlugin: IJobSummaryPlugin
  var _accountRetrievalPlugin: IAccountRetrievalPlugin
  @InjectableNode
  construct(aJobPlugin: IJobPlugin, aSubmissionPlugin: ISubmissionPlugin, aSubmissionSummaryPlugin: ISubmissionSummaryPlugin, aNotePlugin: INotePlugin, aDocumentPlugin: IDocumentPlugin,
            aJobHelper: JobUtil, aUWIssuePlugin: IUWIssuePlugin, aJobSummaryPlugin: IJobSummaryPlugin, anAccountRetrievalPlugin: IAccountRetrievalPlugin) {
    super(aJobPlugin, aJobHelper)

    this._jobPlugin = aJobPlugin
    this._submissionPlugin = aSubmissionPlugin
    this._submissionSummaryPlugin = aSubmissionSummaryPlugin
    this._notePlugin = aNotePlugin
    this._documentPlugin = aDocumentPlugin
    this._jobHelper = aJobHelper
    this._uwIssuePlugin = aUWIssuePlugin
    this._jobSummaryPlugin = aJobSummaryPlugin
    this._accountRetrievalPlugin = anAccountRetrievalPlugin
  }

  /**
   * Create a new submission
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the account by AccountNumber</dd>
   * <dd> <code>ISubmissionPlugin#createSubmission(Account, NewSubmissionDTO)</code> - To create a submission</dd>
   * <dd> <code>ISubmissionPlugin#toDTO(Submission)</code> - To serialize the resulting submission</dd>
   * </dl>
   * @param   newSubmission   NewSubmissionDTO, data about the new submission
   * @returns A  SubmissionDTO, a representation of the resulting Submission entity
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function createNewSubmission(newSubmission: NewSubmissionDTO): SubmissionDTO {
    final var bundle = Bundle.getCurrent()
    final var account = bundle.add(_accountRetrievalPlugin.getAccountByNumber(newSubmission.AccountNumber))

    final var submission = _submissionPlugin.createSubmission(account, newSubmission)

    return _submissionPlugin.toDTO(submission)
  }

  /**
   * Finds a submission job by number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve a Submission Job</dd>
   * <dd> <code>ISubmissionPlugin#toDTO(Submission)</code> - To serialize the resulting submission</dd>
   * </dl>
   * @param   jobNumber   A string Job Number
   * @returns A SubmissionDTO: serialized submission if successfully retrieved, empty otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  override function findJobByJobNumber(jobNumber: String): SubmissionDTO {
    try {
      final var aSubmission = _jobHelper.findJobByJobNumber(jobNumber) as Submission

      return _submissionPlugin.toDTO(aSubmission)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new SubmissionDTO()
  }

  /**
   * Get a Submission summary
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To retrieve a Submission Job</dd>
   * <dd> <code>ISubmissionPlugin#toDTO(Submission)</code> - To serialize the resulting submission</dd>
   * </dl>
   * @param   jobNumber   A string Job Number
   * @returns A SubmissionSummaryDTO: serialized submission if successfully retrieved, empty otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function getSubmissionSummary(jobNumber: String): SubmissionSummaryDTO {
    try {
      final var aSubmission = _jobHelper.findJobByJobNumber(jobNumber) as Submission
      return _submissionSummaryPlugin.toDTO(aSubmission)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new SubmissionSummaryDTO()
  }

  /**
   * Retrieve Submissions created by current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobsByJobTypeAndCreateUser(typekey.Job, entity.User)</code> - to retrieve Submissions made by current user</dd>
   * <dd> <code>ISubmissionPlugin#toDTOArray(Submission[])</code> - To serialize the Submissions</dd>
   * </dl>
   * @returns SubmissionDTO array: serialized submissions if successfully retrieved, empty array otherwise
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findSubmissionsByCreateUser(): SubmissionDTO[] {
    try {
      final var submissions = _jobHelper.findJobsByJobTypeAndCreateUser(typekey.Job.TC_SUBMISSION, User.util.CurrentUser).whereTypeIs(Submission)

      return _submissionPlugin.toDTOArray(submissions)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new SubmissionDTO[]{}
  }

  /**
   * Retrieve Submissions created by current user within given number of days
   *
   *  <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(typekey.Job, entity.User, int)</code> - To retrieve Submissions made by current user for the last X days</dd>
   * <dd> <code>ISubmissionPlugin#toDTOArray(Submission[])</code> - To serialize the Submissions</dd>
   * </dl>
   * @param   numberOfDays  Integer number of days
   * @returns SubmissionDTO array: serialized submissions if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findSubmissionByCreateUserOpenedWithinNumberOfDays(numberOfDays: int): SubmissionDTO[] {
    try {
      final var submissions = _jobHelper.findJobsByJobTypeAndCreateUserOpenedWithinNumberOfDays(typekey.Job.TC_SUBMISSION, User.util.CurrentUser, numberOfDays).whereTypeIs(Submission)

      return _submissionPlugin.toDTOArray(submissions)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new SubmissionDTO[]{}
  }

  /**
   * Get Submissions by the Account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To retrieve jobs for an Account</dd>
   * <dd> <code>ISubmissionPlugin#toDTOArray(Submission[])</code> - To serialize the Submissions</dd>
   * </dl>
   * @param   accountNumber String Account number
   * @returns SubmissionDTO array: serialized submissions if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findSubmissionsByAccount(accountNumber: String): SubmissionDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var submissions = _jobHelper.findJobsByAccount(account, null, typekey.Job.TC_SUBMISSION, User.util.CurrentUser).whereTypeIs(Submission)

      return _submissionPlugin.toDTOArray(submissions)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new SubmissionDTO[]{}
  }

  /**
   * Get Submission summaries by the Account number
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>IAccountRetrievalPlugin#getAccountByNumber(java.lang.String)</code> - To retrieve the Account</dd>
   * <dd> <code>JobUtil#findJobsByAccount(entity.Account, java.lang.Boolean, typekey.Job, entity.User)</code> - To retrieve jobs for an Account</dd>
   * <dd> <code>IJobSummaryPlugin#toDTOArray(entity.Job[])</code> - To serialize the Jobs</dd>
   * </dl>
   * @param   accountNumber String Account number
   * @returns JobSummaryDTO array: serialized submissions if successfully retrieved, empty array otherwise
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  public function findSubmissionSummariesByAccount(accountNumber: String): JobSummaryDTO[] {
    try {
      final var account = _accountRetrievalPlugin.getAccountByNumber(accountNumber)
      final var submissions = _jobHelper.findJobsByAccount(account, null, typekey.Job.TC_SUBMISSION, User.util.CurrentUser)

      return _jobSummaryPlugin.toDTOArray(submissions)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new JobSummaryDTO[]{}
  }

  /**
   * Returns notes related to a given submission.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Submission Job</dd>
   * <dd> <code>INotePlugin#getNotesForJob(entity.Job)</code> - To retrieve Submission notes</dd>
   * </dl>
   * @param   submissionNumber  String Submission number
   * @returns NoteDTO array: Notes relating to the submission.
   *
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getNotesForSubmission(submissionNumber: String): NoteDTO[] {
    try {
      final var submission = _jobHelper.findJobByJobNumber(submissionNumber)

      return _notePlugin.getNotesForJob(submission)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new NoteDTO[]{}
  }

  /**
   * Returns UW Issues related to a given submission.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Submission Job</dd>
   * <dd> <code>ISubmissionPlugin#getUWIssuesForSubmission(entity.Submission)</code> - To retrieve Submission UW issues</dd>
   * </dl>
   * @param   submissionNumber  String Submission number
   * @returns UWIssueDTO array: Underwriting Issues on the current Submission.
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getUWIssuesForSubmission(submissionNumber: String): UWIssueDTO[] {
    try {
      final var submission = _jobHelper.findJobByJobNumber(submissionNumber) as Submission
      return _submissionPlugin.getUWIssuesForSubmission(submission)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new UWIssueDTO[]{}
  }

  /**
   * Creates a Note for an Submission.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Submission Job</dd>
   * <dd> <code>INotePlugin#createNoteForJob(entity.Job, NoteDTO)</code> - To create a new Note</dd>
   * </dl>
   * @param submissionNumber the submission number
   * @param noteDTO The note to be created
   * @return A serialized version of the new Note
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNoteForSubmission(submissionNumber: String, noteDTO: NoteDTO): NoteDTO {
    final var note = Bundle.resolveInTransaction( \ bundle -> {
      final var submission = bundle.add(_jobHelper.findJobByJobNumber(submissionNumber))
      return _notePlugin.createNoteForJob(submission, noteDTO)
    })

    return _notePlugin.toDTO(note)
  }

  /**
   * Returns documents related to a given submission.
   *
   * <dl>
   *   <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Submission Job</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForJob(entity.Job)</code> - To retrieve related Documents</dd>
   * </dl>
   * @param   submissionNumber the submission number
   * @returns DocumentDTO array
   *
   */
  @Returns("Documents relating to the submission.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getDocumentsForSubmission(submissionNumber: String): DocumentDTO[] {
    try {
      final var submission = _jobHelper.findJobByJobNumber(submissionNumber)
      final var documents = _documentPlugin.getDocumentsForJob(submission)

      return _documentPlugin.toDTOArray(documents)
    } catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new DocumentDTO[]{}
  }


  /**
   * Returns documents related to a given submission.
   *
   * <dl>
   * <dt>Calls:</dt>
   * <dd> <code>JobUtil#findJobByJobNumber(java.lang.String)</code> - To get a Submission Job</dd>
   * <dd> <code>IDocumentPlugin#getDocumentsForJob(entity.Job)</code> - To retrieve related Documents</dd>
   * </dl>
   * @param   submissionNumber the submission number
   * @param   noteForUnderwriter an optional note for the underwriter
   * @returns SubmissionDTO
   *
   */
  @Returns("Submission after being refered to underwriter.")
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function referToUnderwriter(submissionNumber: String, noteForUnderwriter: String): SubmissionDTO {
    try {
      var submission = _jobHelper.findJobByJobNumber(submissionNumber) as Submission
      _submissionPlugin.referToUnderwriter(submission, noteForUnderwriter)
      return _submissionPlugin.toDTO(submission)
    }
    catch (ex: Exception) {
      LOGGER.logError(ex)
    }

    return new SubmissionDTO()
  }
}
