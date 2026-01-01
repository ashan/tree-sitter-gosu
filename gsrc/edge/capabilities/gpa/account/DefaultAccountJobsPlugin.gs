package edge.capabilities.gpa.account

uses edge.di.annotations.ForAllGwNodes
uses edge.capabilities.gpa.account.dto.AccountJobsDTO
uses edge.capabilities.gpa.job.IJobSummaryPlugin
uses java.lang.Integer
uses edge.capabilities.helpers.JobUtil
uses java.lang.Exception
uses edge.capabilities.gpa.account.dto.AccountJobsSummaryDTO
uses java.util.ArrayList

class DefaultAccountJobsPlugin implements IAccountJobsPlugin{

  private var _jobPlugin : IJobSummaryPlugin
  private var _jobUtil : JobUtil
  final private static var defaultCreatedInLastXDays : Integer = 30
  final private static var producerCodeMyWork = "myWork"
  final private static var producerCodeAll = "all"

  @ForAllGwNodes
  construct(aJobPlugin : IJobSummaryPlugin, aJobUtil : JobUtil){
    this._jobPlugin = aJobPlugin
    this._jobUtil = aJobUtil
  }

  override function toDTO(anAccount : Account, createdInLastXDays : Integer): AccountJobsDTO {
    var dto = new AccountJobsDTO()

    createdInLastXDays = createdInLastXDays ?: defaultCreatedInLastXDays
    var allJobs : Job[]

    try{
      allJobs = _jobUtil.findJobsByAccountCreatedInLastXDays(anAccount, false, null, User.util.CurrentUser, createdInLastXDays)
    }catch (ex : Exception){
      allJobs = new Job[]{}
    }

    dto.OpenSubmissions = _jobPlugin.toDTOArray(allJobs.where( \ aJob -> aJob typeis Submission))
    dto.OpenPolicyChanges = _jobPlugin.toDTOArray(allJobs.where( \ aJob -> aJob typeis PolicyChange))
    dto.OpenRenewals = _jobPlugin.toDTOArray(allJobs.where( \ aJob -> aJob typeis Renewal))
    dto.OpenCancellations = _jobPlugin.toDTOArray(allJobs.where( \ aJob -> aJob typeis Cancellation))

    return dto
  }

  override function toDTOArray(accounts: Account[], createdInLastXDays: Integer): AccountJobsDTO[] {
    if (accounts != null && !accounts.IsEmpty){
      return accounts.map(\acc -> toDTO(acc, createdInLastXDays))
    }

    return new AccountJobsDTO[]{}
  }

  override function accountJobsSummaryToDTO(aProducerCodeCode : String, jobs : Job[]): AccountJobsSummaryDTO {
    var accountJobsSummaryDTO = initialiseAccountJobsSummaryDTO(aProducerCodeCode)

    calculateAccountJobs(accountJobsSummaryDTO, jobs)

    return accountJobsSummaryDTO
  }

  override function accountJobsSummaryToDTOArray(producerCodes : ProducerCode[], jobs: Job[]): AccountJobsSummaryDTO[] {
    var summaries = new ArrayList<AccountJobsSummaryDTO>()
    if (producerCodes != null && !producerCodes.IsEmpty) {
      producerCodes.each( \ aProducerCode -> summaries.add(accountJobsSummaryToDTO(aProducerCode.Code, filterJobsByProducerCode(aProducerCode, jobs))
      ))
    }
    
    summaries.add(accountJobsSummaryToDTO(producerCodeMyWork, jobs.where( \ aJob -> aJob.CreateUser == User.util.CurrentUser)))
    summaries.add(accountJobsSummaryToDTO(producerCodeAll, jobs))

    return summaries.toTypedArray()
  }

  protected function initialiseAccountJobsSummaryDTO(aProducerCodeCode : String) : AccountJobsSummaryDTO{
    var accountJobsSummaryDTO = new AccountJobsSummaryDTO()

    accountJobsSummaryDTO.ProducerCode = aProducerCodeCode
    accountJobsSummaryDTO.OpenSubmissions = 0
    accountJobsSummaryDTO.OpenPolicyChanges = 0
    accountJobsSummaryDTO.OpenRenewals = 0
    accountJobsSummaryDTO.OpenCancellations = 0

    return accountJobsSummaryDTO
  }

  protected function calculateAccountJobs(accountJobsSummaryDTO: AccountJobsSummaryDTO, jobs: Job[]) {
    if (jobs != null && !jobs.IsEmpty) {
      accountJobsSummaryDTO.OpenSubmissions += jobs.where(\aJob -> aJob typeis Submission).Count
      accountJobsSummaryDTO.OpenPolicyChanges += jobs.where(\aJob -> aJob typeis PolicyChange).Count
      accountJobsSummaryDTO.OpenRenewals += jobs.where(\aJob -> aJob typeis Renewal).Count
      accountJobsSummaryDTO.OpenCancellations += jobs.where(\aJob -> aJob typeis Cancellation).Count
    }
  }

  protected function filterJobsByProducerCode(aProducerCode : ProducerCode, jobs : Job[]) : Job[] {
    return jobs.where( \ aJob -> {
      return aJob.LatestPeriod.ProducerCodeOfRecord == aProducerCode || aJob.LatestPeriod.EffectiveDatedFields.ProducerCode == aProducerCode
    })

  }

}
