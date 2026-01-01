package edge.capabilities.gpa.job.cancellation

uses edge.PlatformSupport.CurrencyPlatformUtil
uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.gpa.job.cancellation.dto.CancellationDTO
uses edge.di.annotations.ForAllGwNodes
uses java.lang.IllegalArgumentException
uses java.lang.Exception
uses java.util.Date
uses edge.PlatformSupport.Bundle
uses edge.capabilities.gpa.job.dto.UWIssueDTO
uses edge.capabilities.gpa.policy.IPolicyPlugin
uses edge.capabilities.gpa.job.IUWIssuePlugin
uses edge.capabilities.gpa.job.IJobPlugin
uses edge.capabilities.gpa.job.DefaultJobPlugin
uses edge.capabilities.gpa.currency.local.ICurrencyPlugin
uses gw.job.CancellationProcess

class DefaultCancellationPlugin implements ICancellationPlugin {

  var _policyPlugin : IPolicyPlugin
  var _uwIssuePlugin : IUWIssuePlugin
  var _jobPlugin : IJobPlugin
  var _currencyPlugin : ICurrencyPlugin

  @ForAllGwNodes
  construct(aPolicyPlugin : IPolicyPlugin, aUWIssuePlugin : IUWIssuePlugin, aJobPlugin : IJobPlugin, aCurrencyPlugin : ICurrencyPlugin) {
    this._policyPlugin = aPolicyPlugin
    this._uwIssuePlugin = aUWIssuePlugin
    this._jobPlugin = aJobPlugin
    this._currencyPlugin = aCurrencyPlugin
  }

  override function toDTO(aCancellation: Cancellation): CancellationDTO {
    final var dto = new CancellationDTO()
    DefaultJobPlugin.fillBaseProperties(dto, aCancellation)
    dto.Policy = _policyPlugin.policyBaseDetailsToDTO(aCancellation.Policy)
    dto.StatusCode = aCancellation.PolicyPeriod.Status
    dto.IsEditLocked = aCancellation.PolicyPeriod.EditLocked
    dto.CanUserView = perm.Cancellation.view(aCancellation)
    dto.EffectiveDate = aCancellation.PolicyPeriod.EditEffectiveDate
    dto.CancelReasonCode = aCancellation.CancelReasonCode
    dto.CancellationRefundMethod = aCancellation.calculateRefundCalcMethod(aCancellation.PolicyPeriod)
    dto.ChangeInCost = _currencyPlugin.toDTO(CurrencyPlatformUtil.toCurrencyAmount(aCancellation.PolicyPeriod.TransactionCostRPT))
    dto.Description = aCancellation.Description
    dto.IsInsuredSource = aCancellation.Source == CancellationSource.TC_INSURED
    dto.IsRefund = aCancellation.PolicyPeriod.TransactionCostRPT.Amount < 0
    dto.CanWithdraw = canWithdraw(aCancellation)
    dto.CanBind = canBind(aCancellation)

    var authProfiles = User.util.CurrentUser.UWAuthorityProfiles
    var uwIssues = aCancellation.SelectedVersion.UWIssuesActiveOnly.viewableToUserWithProfiles(authProfiles)
    dto.UnderwritingIssues = _uwIssuePlugin.toDTOArray(uwIssues)

    return dto
  }

  override function toDTOArray(cancellations: Cancellation[]): CancellationDTO[] {
    if(cancellations != null && cancellations.HasElements){
      return cancellations.map( \ aCancellation -> toDTO(aCancellation))
    }

    return new CancellationDTO[]{}
  }

  override function startCancellation(aPolicy: Policy, dto: CancellationDTO): Cancellation {
    if(aPolicy == null){
      throw new IllegalArgumentException("Policy must not be null.")
    }
    final var canStartCancellation = aPolicy.canStartCancellation(dto.EffectiveDate)

    if(canStartCancellation == null){
      var aCancellation = new Cancellation()
      updateCancellation(aCancellation, dto)
      aCancellation.startJob(aPolicy, dto.EffectiveDate, dto.CancellationRefundMethod)

      return aCancellation
    }

    throw new Exception(
        TranslateUtil.translate("Web.Cancellation.Error.CannotStart", {canStartCancellation})
    )
  }

  override function updateCancellation(aCancellation: Cancellation, dto: CancellationDTO) {
    aCancellation.Source = dto.CancellationSource
    aCancellation.Description = dto.Description
    aCancellation.CancelReasonCode = dto.CancelReasonCode
  }

  override function getValidRefundMethods(policy: Policy, dto : CancellationDTO): CalculationMethod[] {
    final var aCancellation = createTempCancellation(dto)
    final var methods = aCancellation.findValidRefundMethods(policy.LatestPeriod.PolicyStartDate)

    final var bundle = Bundle.getCurrent()
    bundle.delete(aCancellation)

    return methods
  }

  override function getEffectiveDateForCancellation(policy: Policy, dto : CancellationDTO): Date {
    final var aCancellation = createTempCancellation(dto)
    final var effectiveDate = aCancellation.getDefaultEffectiveDate(policy.LatestPeriod, dto.CancellationRefundMethod)
    final var bundle = Bundle.getCurrent()
    bundle.delete(aCancellation)

    return effectiveDate
  }

  override function getUWIssuesForCancellation(aCancellation: Cancellation): UWIssueDTO[] {
    return _jobPlugin.getUWIssuesForJob(aCancellation)
  }

  override function referToUnderwriter(aCancellation: Cancellation, noteForUnderwriter: String): Cancellation {
    return _jobPlugin.referToUnderwriter(aCancellation, noteForUnderwriter) as Cancellation
  }

  override function bindCancellation(aCancellation: Cancellation): Cancellation {
    var aBundle = Bundle.getCurrent()
    var cancellationProcess = new CancellationProcess(aBundle.add(aCancellation.PolicyPeriod))
    cancellationProcess.cancelImmediately()

    return aCancellation
  }

  protected function createTempCancellation(dto: CancellationDTO): Cancellation {
    final var aCancellation = new Cancellation()
    aCancellation.Source = dto.CancellationSource
    aCancellation.CancelReasonCode = dto.CancelReasonCode

    return aCancellation
  }

  protected function canWithdraw(aCancellation : Cancellation) : boolean {
    return aCancellation.PolicyPeriod.Status != PolicyPeriodStatus.TC_WITHDRAWN
        && aCancellation.PolicyPeriod.Status != PolicyPeriodStatus.TC_BOUND
        && aCancellation.CloseDate == null
        && aCancellation.Source == CancellationSource.TC_INSURED
        && perm.Cancellation.withdraw(aCancellation)
  }

  protected function canBind(aCancellation : Cancellation) : boolean {
    return aCancellation.PolicyPeriod.Status != PolicyPeriodStatus.TC_WITHDRAWN
        && aCancellation.PolicyPeriod.Status != PolicyPeriodStatus.TC_BOUND
        && aCancellation.CloseDate == null
        && !aCancellation.PolicyPeriod.EditLocked
        && perm.Cancellation.bind(aCancellation)
  }

}
