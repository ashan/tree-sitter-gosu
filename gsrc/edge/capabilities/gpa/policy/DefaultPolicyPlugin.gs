package edge.capabilities.gpa.policy

uses edge.capabilities.gpa.policy.dto.PolicyDTO
uses edge.capabilities.gpa.account.IAccountPlugin
uses edge.capabilities.gpa.product.IProductPlugin
uses edge.di.annotations.ForAllGwNodes
uses java.lang.Exception
uses edge.exception.EntityNotFoundException
uses edge.capabilities.gpa.claim.IClaimSummaryPlugin
uses edge.capabilities.gpa.document.IDocumentPlugin
uses edge.capabilities.gpa.note.INotePlugin
uses java.util.Date

class DefaultPolicyPlugin implements IPolicyPlugin {

  private var _accountPlugin : IAccountPlugin
  private var _policyPeriodPlugin : IPolicyPeriodPlugin
  private var _claimSummaryPlugin : IClaimSummaryPlugin
  private var _documentPlugin: IDocumentPlugin
  private var _notePlugin: INotePlugin
  private var _productPlugin: IProductPlugin

  @ForAllGwNodes
  construct(anAccountPlugin : IAccountPlugin, aPolicyPeriodPlugin : IPolicyPeriodPlugin, aClaimSummaryPlugin : IClaimSummaryPlugin, aDocumentPlugin : IDocumentPlugin, aNotePlugin : INotePlugin, aProductPlugin : IProductPlugin){
    this._accountPlugin = anAccountPlugin
    this._policyPeriodPlugin = aPolicyPeriodPlugin
    this._claimSummaryPlugin = aClaimSummaryPlugin
    this._documentPlugin = aDocumentPlugin
    this._notePlugin = aNotePlugin
    this._productPlugin = aProductPlugin
  }

  override function toDTO(aPolicy: Policy): PolicyDTO {

    final var dto = policyBaseDetailsToDTO(aPolicy)

    try {
      dto.NumberOfOpenActivities = aPolicy.AllOpenActivities.where(\anActivity -> perm.Activity.view(anActivity)).Count
    } catch (e: Exception) {
      dto.NumberOfOpenActivities = 0
    }

    try {
      dto.NumberOfNotes = _notePlugin.getNotesForPolicy(aPolicy).Count
    } catch (e: Exception) {
      dto.NumberOfNotes = 0
    }

    try {
      dto.NumberOfDocuments = _documentPlugin.getDocumentsForPolicy(aPolicy).Count
    } catch (e: Exception) {
      dto.NumberOfDocuments = 0
    }

    try {
      if((aPolicy.Issued or aPolicy.LatestPeriod.Status == PolicyPeriodStatus.TC_BOUND) and Date.CurrentDate.after(aPolicy.LatestPeriod.PeriodStart)){//Date check is to confirm the policy isn't scheduled
        dto.NumberOfOpenClaims = _claimSummaryPlugin.getPolicyClaims(aPolicy.LatestPeriod).Count
      }
    } catch (e: EntityNotFoundException) {
      dto.NumberOfOpenClaims = 0
    }

    return dto
  }

  override function policyBaseDetailsToDTO(aPolicy: Policy): PolicyDTO {
    final var dto = new PolicyDTO()
    fillBaseProperties(dto, aPolicy)
    dto.Account = _accountPlugin.accountBaseDetailsToDTO(aPolicy.Account)
    dto.LatestPeriod = _policyPeriodPlugin.toDTO(aPolicy.LatestPeriod)
    dto.Periods = _policyPeriodPlugin.toDTOArray(aPolicy.Periods)
    dto.CanUserView = perm.PolicyPeriod.view(aPolicy.LatestPeriod)
    dto.Product = _productPlugin.toDTO(aPolicy.Product)
    return dto
  }

  override function policyBaseDetailsToDTOArray(policies: Policy[]): PolicyDTO[] {
    if(policies != null && policies.HasElements){
      return policies.map( \ aPolicy -> policyBaseDetailsToDTO(aPolicy))
    }

    return new PolicyDTO[]{}
  }

  override function toDTOArray(policies: Policy[]): PolicyDTO[] {
    if(policies != null && policies.HasElements){
      return policies.map( \ aPolicy -> toDTO(aPolicy))
    }

    return new PolicyDTO[]{}
  }

  public static function fillBaseProperties(dto: PolicyDTO, aPolicy: Policy) {
    dto.PublicID = aPolicy.PublicID
    dto.IssueDate = aPolicy.IssueDate
    dto.Issued = aPolicy.Issued
    dto.PolicyNumber = aPolicy.LatestPeriod.PolicyNumber?.equals("Unassigned") ? null : aPolicy.LatestPeriod.PolicyNumber
  }

}
