package edge.capabilities.gpa.policy

uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcRunAsInternalGWUser
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.di.annotations.InjectableNode
uses edge.capabilities.helpers.PolicyUtil
uses edge.capabilities.gpa.policy.dto.PolicyDTO
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.gpa.note.dto.NoteDTO
uses edge.capabilities.gpa.job.dto.JobDTO
uses java.lang.Exception
uses edge.capabilities.gpa.job.policychange.IPolicyChangePlugin
uses edge.capabilities.gpa.job.policychange.dto.PolicyChangeDTO
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.gpa.job.renewal.IRenewalPlugin
uses edge.capabilities.gpa.job.cancellation.ICancellationPlugin
uses edge.capabilities.gpa.job.cancellation.dto.CancellationDTO
uses java.util.Date
uses edge.capabilities.helpers.JobUtil
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.document.dto.DocumentDTO
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.capabilities.gpa.billing.IPolicyBillingSummaryPlugin
uses edge.capabilities.gpa.billing.dto.PolicyBillingSummaryDTO
uses edge.capabilities.gpa.claim.IClaimSummaryPlugin
uses edge.capabilities.gpa.claim.dto.ClaimSummaryDTO
uses edge.capabilities.gpa.policy.dto.PolicySummaryDTO
uses edge.capabilities.gpa.account.search.IAccountSearchPlugin
uses edge.capabilities.gpa.job.dto.JobSummaryDTO
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses java.lang.Integer
uses edge.PlatformSupport.Bundle

class PolicyHandler implements IRpcHandler{

  private static var LOGGER = new Logger(Reflection.getRelativeName(PolicyHandler))

  private var _policyPlugin : IPolicyPlugin
  private var _notePlugin : INotePlugin
  private var _jobPlugin : IJobPlugin
  private var _policyChangePlugin : IPolicyChangePlugin
  private var _renewalPlugin  : IRenewalPlugin
  private var _cancellationPlugin  : ICancellationPlugin
  private var _documentPlugin  : IDocumentPlugin
  private var _policyBillingSummaryPlugin : IPolicyBillingSummaryPlugin
  private var _claimSummaryPlugin : IClaimSummaryPlugin
  private var _policySummaryPlugin : IPolicySummaryPlugin
  private var _accountSearchPlugin : IAccountSearchPlugin
  private var _jobSummaryPlugin : IJobSummaryPlugin
  private var _policyHelper : PolicyUtil
  private var _jobHelper : JobUtil

  @InjectableNode
  construct(aPolicyPlugin : IPolicyPlugin, aNotePlugin : INotePlugin, aJobPlugin : IJobPlugin,
              aPolicyChangePlugin : IPolicyChangePlugin, aRenewalPlugin : IRenewalPlugin, aCancellationPlugin : ICancellationPlugin,
              aDocumentPlugin : IDocumentPlugin, aPolicyBillingSummaryPlugin : IPolicyBillingSummaryPlugin, aClaimSummaryPlugin : IClaimSummaryPlugin,
              aPolicySummaryPlugin : IPolicySummaryPlugin, anAccountSearchPlugin : IAccountSearchPlugin, aJobSummaryPlugin : IJobSummaryPlugin,
              aPolicyHelper : PolicyUtil, aJobHelper : JobUtil){
    this._policyPlugin = aPolicyPlugin
    this._notePlugin = aNotePlugin
    this._jobPlugin = aJobPlugin
    this._policyChangePlugin = aPolicyChangePlugin
    this._renewalPlugin = aRenewalPlugin
    this._cancellationPlugin = aCancellationPlugin
    this._documentPlugin = aDocumentPlugin
    this._policyBillingSummaryPlugin = aPolicyBillingSummaryPlugin
    this._claimSummaryPlugin = aClaimSummaryPlugin
    this._policySummaryPlugin = aPolicySummaryPlugin
    this._accountSearchPlugin = anAccountSearchPlugin
    this._jobSummaryPlugin = aJobSummaryPlugin
    this._policyHelper = aPolicyHelper
    this._jobHelper = aJobHelper
  }


  /**
   * Get policy by policy number
   *
   *  <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IPolicyPlugin#toDTO(Policy)</code> - To serialize the Policy</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns PolicyDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicy(policyNumber: String): PolicyDTO {
    try{
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)

      return _policyPlugin.toDTO(policy)
    }catch(ex :Exception){
      LOGGER.logError(ex)
    }

    return new PolicyDTO()
  }

  /**
   * creates a note for a policy
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>INotePlugin#createNoteForPolicy(policy, noteDTO)</code> - To create Note on the Policy</dd>
   *   <dd><code>IPolicyPlugin#toDTO(Policy)</code> - To serialize the Policy</dd>
   * </dl>
   * @param   policyNumber    String
   * @param   noteDTO    NoteDTO
   * @returns NoteDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createNoteForPolicy(policyNumber: String, noteDTO: NoteDTO): NoteDTO {
    final var note = Bundle.resolveInTransaction( \ bundle -> {
      final var policy = bundle.add(_policyHelper.getPolicyByPolicyNumber(policyNumber))
      return _notePlugin.createNoteForPolicy(policy, noteDTO)
    })

    return _notePlugin.toDTO(note)
  }

  /**
   * Returns notes related to a given policy.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>INotePlugin#getNotesForPolicy(policy)</code> - To retrieve Notes on the Policy</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns NoteDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getNotesForPolicy(policyNumber: String): NoteDTO[] {
    try{
      final var bundle = Bundle.getCurrent()
      final var policy = bundle.add(_policyHelper.getPolicyByPolicyNumber(policyNumber))

      return _notePlugin.getNotesForPolicy(policy)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new NoteDTO[]{}
  }

  /**
   * Creates, Starts and returns a Policy Change transaction.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IPolicyChangePlugin#startPolicyChange(policy, policyChangeDTO)</code> - To start a Policy Change on the Policy</dd>
   *   <dd><code>IJobSummaryPlugin#toDTO(Job)</code> - To serialize the Job</dd>
   * </dl>
   * @param   policyChangeDTO    PolicyChangeDTO
   * @returns JobDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createPolicyChangeTransaction(policyChangeDTO : PolicyChangeDTO): JobDTO  {
    final var policy = _policyHelper.getPolicyByPolicyNumber(policyChangeDTO.PolicyNumber)
    final var aPolicyChange = _policyChangePlugin.startPolicyChange(policy, policyChangeDTO)

    return _jobPlugin.toDTO(aPolicyChange)
  }

  /**
   * Creates, starts and returns a policy renewal transaction
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IRenewalPlugin#startRenewal(policy)</code> - To start a Policy renewal</dd>
   *   <dd><code>IJobSummaryPlugin#toDTO(Job)</code> - To serialize the Job</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns JobDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createPolicyRenewalTransaction(policyNumber: String): JobDTO {
    final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)
    var aRenewal = _renewalPlugin.startRenewal(policy)

    return _jobPlugin.toDTO(aRenewal)
  }

  /**
   *  Creates a Policy Cancellation Transaction and returns it
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>ICancellationPlugin#startCancellation(policy, cancellationDTO)</code> - To start a Policy cancellation</dd>
   *   <dd><code>IJobSummaryPlugin#toDTO(Job)</code> - To serialize the Job</dd>
   * </dl>
   * @param   policyNumber    String
   * @param   cancellationDTO    CancellationDTO
   * @returns JobDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function createPolicyCancellationTransaction(policyNumber: String, cancellationDTO: CancellationDTO): JobDTO {
    final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)
    final var aCancellation = _cancellationPlugin.startCancellation(policy, cancellationDTO)

    return _jobPlugin.toDTO(aCancellation)
  }

  /**
   * Returns the Effective Date for the given PolicyChange
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IPolicyChangePlugin#getEffectiveDateForPolicyChange(policy)</code> - To retrieve effective date for Policy Change</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns Date
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getEffectiveDateForPolicyChange(policyNumber: String): Date {
    final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)

    return _policyChangePlugin.getEffectiveDateForPolicyChange(policy)
  }

  /**
   *  Returns the policy transactions for the given policy
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>JobUtil#findJobsByPolicy(policy)</code> - To retrieve Jobs on a Policy</dd>
   *   <dd><codeIJobSummaryPlugin#toDTOArray(Jobs)</code> - To serialize the Jobs</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns JobSummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicyTransactionsForPolicy(policyNumber: String): JobSummaryDTO[] {
    try{
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)
      final var jobs = _jobHelper.findJobsByPolicy(policy)

      return _jobSummaryPlugin.toDTOArray(jobs)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new JobSummaryDTO[]{}
  }

  /**
   * Returns documents related to a given policy.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IDocumentPlugin#getDocumentsForPolicy(policy)</code> - To retrieve Documents on a Policy</dd>
   *   <dd><IDocumentPlugin#toDTOArray(Documents)</code> - To serialize the Documents</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns DocumentDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getDocumentsForPolicy(policyNumber: String): DocumentDTO[] {
    try{
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)
      final var policyDocuments = _documentPlugin.getDocumentsForPolicy(policy)

      return _documentPlugin.toDTOArray(policyDocuments)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new DocumentDTO[]{}
  }

  /**
   * Returns billing summary information for given policy.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IPolicyBillingSummaryPlugin#getPolicyBillingSummary(policy)</code> - To retrieve billing summary for a Policy</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns PolicyBillingSummaryDTO
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicyBillingSummaryInfo(policyNumber : String) : PolicyBillingSummaryDTO {
    try{
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)

      return _policyBillingSummaryPlugin.getPolicyBillingSummary(policy)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new PolicyBillingSummaryDTO()
  }

  /**
   * Returns claim summary information for given policy.
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>IClaimSummaryPlugin#getPolicyClaims(policy)</code> - To retrieve claims for a Policy</dd>
   * </dl>
   * @param   policyNumber    String
   * @returns ClaimSummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicyClaims(policyNumber : String) : ClaimSummaryDTO[] {
    try{
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)

      return _claimSummaryPlugin.getPolicyClaims(policy.LatestPeriod)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new ClaimSummaryDTO[]{}
  }

  /**
   * Returns recently viewed policies for the current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getRecentlyViewedPolicies(User.util.CurrentUser)</code> - To retrieve recently viewed Policies</dd>
   *   <dd><code>IPolicySummaryPlugin#toDTOArray(policies)</code> - To serialize Policies</dd>
   * </dl>
   * @returns PolicySummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getRecentlyViewedPolicies() : PolicySummaryDTO[] {
    try{
      final var policies = _policyHelper.getRecentlyViewedPolicies(User.util.CurrentUser)

      return _policySummaryPlugin.toDTOArray(policies, false)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new PolicySummaryDTO[]{}
  }

  /**
   * Add the policy to the recently viewed list for the current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPolicyByPolicyNumber(String)</code> - To retrieve a Policy</dd>
   *   <dd><code>PolicyUtil#addRecentlyViewedPolicy(User.util.CurrentUser, policy)</code> - To add Policy to recently viewed list</dd>
   * </dl>
   * @param   policyNumber    String
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function addRecentlyViewedPolicy(policyNumber : String) {
    try{
      final var policy = _policyHelper.getPolicyByPolicyNumber(policyNumber)
      _policyHelper.addRecentlyViewedPolicy(User.util.CurrentUser, policy)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }
  }

  /**
   * Gets the Policies issued in the last X days, defaults to 30
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getRecentlyIssuedPolicies(numberOfDays)</code> - To retrieve recently created Policies</dd>
   *   <dd><code>IPolicySummaryPlugin#toDTOArray(policies)</code> - To serialize Policies</dd>
   * </dl>
   * @param   numberOfDays    int
   * @returns PolicySummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getRecentlyIssuedPolicies(numberOfDays : int) : PolicySummaryDTO[] {
    try{
      final var policies = _policyHelper.getRecentlyIssuedPolicies(numberOfDays)

      return _policySummaryPlugin.toDTOArray(policies, false)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new PolicySummaryDTO[]{}
  }

  /**
   * Returns policy summaries for the current user
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPoliciesForProducer(CurrentUser)</code> - To retrieve Policies for an User</dd>
   *   <dd><code>IPolicySummaryPlugin#toDTOArray(Policies, boolean)</code> - To serialize Policy Summaries</dd>
   * </dl>
   * @returns PolicySummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicySummariesForCurrentUser() : PolicySummaryDTO[] {
    try{
      final var policies = _policyHelper.getPoliciesForProducer(User.util.CurrentUser)

      return _policySummaryPlugin.toDTOArray(policies, false)
    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new PolicySummaryDTO[]{}
  }


  /**
   * Returns policy summaries for provided policy numbers
   *
   * <dl>
   *   <dt>Calls:</dt>
   *   <dd><code>PolicyUtil#getPoliciesByPolicyNumbers(policyNumbers)</code> - To retrieve Policies for provided</dd>
   *   <dd><code>IPolicySummaryPlugin#toDTOArray(Policies, boolean)</code> - To serialize Policy Summaries</dd>
   * </dl>
   * @returns PolicySummaryDTO[]
   */
  @JsonRpcRunAsInternalGWUser
  @JsonRpcMethod
  function getPolicySummariesFromPolicyNumbers(policyNumbers : String[]) : PolicySummaryDTO[] {
    try{
      final var policies = _policyHelper.getPoliciesByPolicyNumbers(policyNumbers)
      return _policySummaryPlugin.toDTOArray(policies, false)

    }catch(ex : Exception){
      LOGGER.logError(ex)
    }

    return new PolicySummaryDTO[]{}
  }



}
