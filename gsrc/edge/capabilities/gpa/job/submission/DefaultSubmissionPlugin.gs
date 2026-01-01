package edge.capabilities.gpa.job.submission

uses edge.capabilities.gpa.job.submission.dto.NewSubmissionDTO
uses edge.capabilities.gpa.job.submission.dto.ProductSelectionDTO
uses gw.api.util.StateJurisdictionMappingUtil
uses java.lang.Iterable
uses edge.di.annotations.ForAllGwNodes
uses java.util.Date
uses edge.capabilities.gpa.job.submission.dto.SubmissionDTO
uses edge.capabilities.gpa.job.DefaultJobPlugin
uses edge.capabilities.gpa.policy.IPolicyPlugin
uses edge.capabilities.gpa.job.IUWIssuePlugin
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses gw.pcf.UWActivityPopupHelper
uses edge.capabilities.gpa.job.IJobPlugin

class DefaultSubmissionPlugin implements ISubmissionPlugin {

  var _policyPlugin : IPolicyPlugin
  var _uwIssuePlugin : IUWIssuePlugin
  var _jobPlugin : IJobPlugin

  @ForAllGwNodes
  construct(aPolicyPlugin : IPolicyPlugin, aUWIssuePlugin : IUWIssuePlugin, aJobPlugin : IJobPlugin) {
    this._policyPlugin = aPolicyPlugin
    this._uwIssuePlugin = aUWIssuePlugin
    this._jobPlugin = aJobPlugin
  }

  override function toDTO(aSubmission: Submission): SubmissionDTO {
    final var dto = new SubmissionDTO()
    DefaultJobPlugin.fillBaseProperties(dto, aSubmission)
    dto.JobNumber = aSubmission.JobNumber
    dto.Policy = _policyPlugin.policyBaseDetailsToDTO(aSubmission.Policy)
    dto.StatusCode = aSubmission.LatestPeriod.Status
    dto.IsEditLocked = aSubmission.LatestPeriod.EditLocked
    dto.CanUserView = perm.Submission.view(aSubmission)
    dto.UnderwritingIssues = _uwIssuePlugin.toDTOArray(aSubmission)

    return dto
  }

  override function toDTOArray(submissions: Submission[]): SubmissionDTO[] {
    if(submissions != null && submissions.HasElements){
      return submissions.map( \ submission -> toDTO(submission))
    }

    return new SubmissionDTO[]{}
  }

  override function createSubmission(anAccount: Account, dto: NewSubmissionDTO): Submission {
    final var producerCode : ProducerCode = gw.api.database.Query.make(ProducerCode).compare("Code", Equals, dto.ProducerCode).select().AtMostOneRow
    final var producerSelection = createProducerSelection(producerCode, dto.EffectiveDate)

    final var productSelection = createProductSelection(dto.ProductCode)

    // create submission
    final var submission = productSelection.createSubmission(anAccount, producerSelection)

    final var branch = submission.LatestPeriod

    /* We work on custom period and create offerings only during quoting. */
    branch.Offering = null

    branch.UWCompany = branch.getUWCompaniesForStates(false).first()

    // Set the branch name so that we can identify the quote in the portal.  Maps to quote type enum values
    branch.BranchName = "CUSTOM"

    branch.SubmissionProcess.beginEditing()

    return submission
  }

  override function getAvailableProducts(anAccount : Account, dto: NewSubmissionDTO): ProductSelectionDTO[] {
    final var _producerCode = gw.api.database.Query.make(ProducerCode).compare("Code", Equals, dto.ProducerCode).select().AtMostOneRow
    final var _state = dto.State

    final var policyProductRoot = new PolicyProductRoot() {
        : ProducerCode = _producerCode,
        : Producer = _producerCode.Organization,
        : Account = anAccount,
        : State = StateJurisdictionMappingUtil.getJurisdictionMappingForState(_state),
        : EffDate = dto.EffectiveDate
    }

    final var availableProducts = anAccount.getAvailableProducts(policyProductRoot)

    return productSelectionsToDTOs(availableProducts)
  }

  public static function productSelectionToDTO(aProductSelection : ProductSelection) : ProductSelectionDTO{
    final var dto = new ProductSelectionDTO()
    dto.ProductCode = aProductSelection.Product.CodeIdentifier
    dto.ProductName = aProductSelection.Product.DisplayName
    dto.Status = aProductSelection.ProductSelectionStatus.DisplayName
    dto.IsRiskReserved = aProductSelection.ProductSelectionStatus == ProductSelectionStatus.TC_RISKRESERVED

    return dto
  }

  public static function productSelectionsToDTOs(productSelections: Iterable<ProductSelection>): ProductSelectionDTO[] {
    if (productSelections == null || !productSelections.HasElements){
      return null
    }

    final var dtos = new ProductSelectionDTO[productSelections.Count]

    productSelections.eachWithIndex(\aProductSelection, i -> {
      dtos[i] = productSelectionToDTO(aProductSelection)
    })

    return dtos
  }

  protected function createProducerSelection(aProducerCode : ProducerCode, effectiveDate : Date) : ProducerSelection{
    final var producerSelection = new ProducerSelection()
    producerSelection.Producer = aProducerCode.Organization
    producerSelection.ProducerCode = aProducerCode
    producerSelection.DefaultPPEffDate = effectiveDate
    // DE102 - Set the Producer Selection state to NZ as the producer is ACC.
    producerSelection.State = Jurisdiction.TC_NZ

    return producerSelection
  }

  protected function createProductSelection(productCode: String): ProductSelection {
    final var productSelection = new ProductSelection()
    productSelection.ProductCode = productCode

    productSelection.ProductSelectionStatus = ProductSelectionStatus.TC_AVAILABLE

    return productSelection
  }

  override function getUWIssuesForSubmission(aSubmission: Submission): UWIssueDTO[] {
    return _jobPlugin.getUWIssuesForJob(aSubmission)
  }

  override function referToUnderwriter(aSubmission : Submission, noteForUnderWriter : String): Submission {
    return _jobPlugin.referToUnderwriter(aSubmission, noteForUnderWriter) as Submission
  }

}
