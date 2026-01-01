package edge.capabilities.gpa.job

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.capabilities.gpa.job.dto.JobSummaryDTO
uses edge.capabilities.gpa.product.IProductPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.policy.IPolicyLinePlugin
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin

class DefaultJobSummaryPlugin implements IJobSummaryPlugin {

  private var _policyLinePlugin : IPolicyLinePlugin
  private var _currencyPlugin : ICurrencyPlugin
  private var _productPlugin : IProductPlugin

  @ForAllGwNodes
  construct(aPolicyLinePlugin : IPolicyLinePlugin, aCurrencyPlugin : ICurrencyPlugin, aProductPlugin : IProductPlugin){
    _policyLinePlugin = aPolicyLinePlugin
    _currencyPlugin = aCurrencyPlugin
    _productPlugin = aProductPlugin
  }


  override function toDTO(aJob: Job): JobSummaryDTO {
    final var dto = new JobSummaryDTO()
    dto.PublicID = aJob.PublicID
    dto.DisplayType = aJob.DisplayType
    dto.Status = aJob.DisplayStatus
    dto.CloseDate = aJob.CloseDate
    dto.CreateTime = aJob.CreateTime
    dto.JobNumber = aJob.JobNumber
    dto.Type = aJob.Subtype
    dto.CreatedByMe = aJob.CreateUser == User.util.CurrentUser
    dto.CanUserView = (User.util.CurrentUser as User).canView(aJob)
    dto.PolicyNumber = aJob.LatestPeriod.PolicyNumber?.equals("Unassigned") ? null : aJob.LatestPeriod.PolicyNumber
    dto.PolicyIssued = aJob.Policy.Issued
    dto.AccountNumber = aJob.Policy.Account.AccountNumber
    dto.AccountHolderName = aJob.Policy.Account.AccountHolderContact.DisplayName
    dto.PolicyLines = _policyLinePlugin.getPolicyLines(aJob.LatestPeriod)
    dto.ProducerCodeOfRecord = aJob.LatestPeriod.ProducerCodeOfRecord.Code
    dto.ProducerCodeOfService = aJob.LatestPeriod.EffectiveDatedFields.ProducerCode.Code
    dto.TotalPremium = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aJob.LatestPeriod.TotalPremiumRPT))
    dto.PolicyEffectiveDate = aJob.getJobDate()
    dto.PolicyDisplayStatus = aJob.LatestPeriod.PeriodDisplayStatus
    dto.Product = _productPlugin.toDTO(aJob.Policy.Product)

    return dto
  }

  override function toDTOArray(jobs: Job[]): JobSummaryDTO[] {
    if(jobs != null && jobs.HasElements){
      return jobs.map( \ aJob -> toDTO(aJob))
    }

    return new JobSummaryDTO[]{}
  }
}
