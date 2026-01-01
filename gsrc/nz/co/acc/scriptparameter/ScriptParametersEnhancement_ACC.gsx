package nz.co.acc.scriptparameter

uses gw.api.util.CurrencyUtil
uses gw.pl.currency.MonetaryAmount
uses gw.lang.ScriptParameters
uses java.math.BigDecimal


/**
 * Created by nitesh.gautam on 03-Nov-17.
 */
enhancement ScriptParametersEnhancement_ACC : ScriptParameters {
  /**
   * Toggle switch to turn on/off KeyVault Authentication.
   *
   * @return {@code true} if KeyVault Authentication turned on.
   */
  public static property get KeyVaultAuthenticationEnabled_ACC() : Boolean {
    return ScriptParameters.getParameterValue("KeyVaultAuthenticationEnabled_ACC") as Boolean
  }

  /**
   * List of users available for KeyVault Authentication
   *
   * @return {@code String} of comma separated users.
   */
  public static property get KeyVaultAuthenticationUsers_ACC() : String {
    return ScriptParameters.getParameterValue("KeyVaultAuthenticationUsers_ACC")?.toString()
  }

  public static property get ERDatabaseLoginTimeoutInSeconds_ACC() : int {
    return ScriptParameters.getParameterValue("ERDatabaseLoginTimeoutInSeconds_ACC") as Integer
  }


  public static property get MaxAllowedDaysForPRD_ACC() : int {
    return ScriptParameters.getParameterValue("MaxAllowedDaysForPRD_ACC") as Integer
  }

  public static property get CPXMaximumCoverPermittedThreshold_ACC() : MonetaryAmount {
    return new MonetaryAmount(ScriptParameters.getParameterValue("CPXMaximumCoverPermittedThreshold_ACC") as BigDecimal, CurrencyUtil.DefaultCurrency)
  }

  // ChrisA 04/03/2020 JUNO-2391 restart waived FA or Cancel In Progress FA
  public static property get AllowFinalAuditsToBeWaived_ACC() : Boolean {
    return ScriptParameters.getParameterValue("AllowFinalAuditsToBeWaived_ACC") as Boolean
  }

  // ChrisA 26/05/2020 JUNO-3966
  public static property get SelfEmployedNewLEStartYear_ACC() : Integer {
    return ScriptParameters.getParameterValue("SelfEmployedNewLEStartYear") as Integer
  }

  public static property get NZBNEventHubThrottleIntervalMs() : Integer {
    return ScriptParameters.getParameterValue("NZBNEventHubThrottleIntervalMs") as Integer;
  }

  // ChrisA/RajB 28/01/2021 JUNO-7123 Remove AEP Discount
  public static property get AEPDiscountAccountsToExclude_ACC() : String {
    return ScriptParameters.getParameterValue("AEPDiscountAccountsToExclude_ACC")?.toString()
  }

  public static property get InstructionFileLoaderBatchSize_ACC() : Integer {
    return ScriptParameters.getParameterValue("InstructionFileLoaderBatchSize_ACC") as Integer;
  }

  public static property get DCAInvoiceCopyPolicyLines_ACC() : String {
    return ScriptParameters.getParameterValue("DCAInvoiceCopyPolicyLines_ACC")?.toString()
  }

  public static property get AllowHistoricalYearProcessing_ACC() : Boolean {
    return ScriptParameters.getParameterValue("AllowHistoricalYearProcessing_ACC") as Boolean
  }

  public static property get AccountStatusUpdateEnabled_ACC() : Boolean {
    return ScriptParameters.getParameterValue("AccountStatusUpdateEnabled_ACC") as Boolean
  }

  public static property get JunoInformationServiceRenewalsNotificationsEnabled_ACC(): Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceRenewalsNotificationsEnabled_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadSelectAEPContractOnly_ACC(): Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadSelectAEPContractOnly_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadAccounts_ACC() : Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadAccounts_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadPolicyTermsAEP_ACC() : Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadPolicyTermsAEP_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadPolicyTermsCPCPX_ACC() : Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadPolicyTermsCPCPX_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadPolicyTermsWPC_ACC() : Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadPolicyTermsWPC_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadPolicyTermsWPS_ACC() : Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadPolicyTermsWPS_ACC") as boolean
  }

  public static property get JunoInformationServiceBulkLoadDocuments_ACC() : Boolean {
    return ScriptParameters.getParameterValue("JunoInformationServiceBulkLoadDocuments_ACC") as boolean
  }

  public static property get UseBillingSystemQueueforAllBillingMessages_ACC() : Boolean {
    return ScriptParameters.getParameterValue("UseBillingSystemQueueforAllBillingMessages_ACC") as Boolean
  }

  public static property get EarningsCutoffMonth_ACC() : int {
    return ScriptParameters.getParameterValue("EarningsCutoffMonth_ACC") as int
  }

  public static property get EarningsCutoffDay_ACC() : int {
    return ScriptParameters.getParameterValue("EarningsCutoffDay_ACC") as int
  }

  public static property get AllowIRContactFieldsStatusChange_ACC() : Boolean {
    return ScriptParameters.getParameterValue("AllowIRContactFieldsStatusChange_ACC") as Boolean;
  }

  public static property get ForceInactiveCeasetoActive_ACC(): Boolean {
    return ScriptParameters.getParameterValue("ForceInactiveCeasetoActive_ACC") as Boolean;
  }

  public static property get WithdrawOpenTransactionsDaysOld_ACC() : Integer {
    return ScriptParameters.getParameterValue("WithdrawOpenTransactionsDaysOld_ACC") as Integer
  }

  public static property get RenewOnActiveStatus_ACC() : Boolean {
    return ScriptParameters.getParameterValue("RenewOnActiveStatus_ACC") as Boolean
  }

  public static property get CheckVFCOnPolicyRenewal_ACC() : Boolean {
    return ScriptParameters.getParameterValue("CheckVFCOnPolicyRenewal_ACC") as Boolean
  }

  public static property get VFCManualOverrideExpiryDays_ACC() : int {
    return ScriptParameters.getParameterValue("VFCManualOverrideExpiryDays_ACC") as int
  }

  public static property get HistoricDebitOffset_ACC() : int {
    return (ScriptParameters.getParameterValue("HistoricDebitOffset_ACC") as BigDecimal).intValue()
  }

  public static property get PremiumThresholdEmployerTaxInvoice_ACC() : BigDecimal {
    return ScriptParameters.getParameterValue("PremiumThresholdEmployerTaxInvoice_ACC") as BigDecimal
  }

  public static property get PremiumThresholdEmployerReassessment_ACC() : BigDecimal {
    return ScriptParameters.getParameterValue("PremiumThresholdEmployerReassessment_ACC") as BigDecimal
  }

  public static property get PremiumThresholdSelfEmployedTaxInvoice_ACC() : BigDecimal {
    return ScriptParameters.getParameterValue("PremiumThresholdSelfEmployedTaxInvoice_ACC") as BigDecimal
  }

  public static property get PremiumThresholdSelfEmployedReassessment_ACC() : BigDecimal {
    return ScriptParameters.getParameterValue("PremiumThresholdSelfEmployedReassessment_ACC") as BigDecimal
  }

  public static property get RenewToCurrentOnCREG_ACC(): Boolean {
    return ScriptParameters.getParameterValue("RenewToCurrentOnCREG_ACC") as Boolean;
  }

  public static property get SecureMessagingMaxMessageSize_ACC() : int {
    return ScriptParameters.getParameterValue("SecureMessagingMaxMessageSize_ACC") as int
  }
  public static property get ERStartLevyYear_ACC() : Integer {
    return ScriptParameters.getParameterValue("ERStartLevyYear_ACC") as Integer
  }

  public static property get EREndLevyYear_ACC() : Integer {
    return ScriptParameters.getParameterValue("EREndLevyYear_ACC") as Integer
  }

  public static property get SecureMessagingMaxNoteSize_ACC() : int {
    return ScriptParameters.getParameterValue("SecureMessagingMaxNoteSize_ACC") as int
  }

  public static property get OverseasIncomeEnabled_ACC() : boolean {
    return ScriptParameters.getParameterValue("OverseasIncomeEnabled_ACC") as boolean
  }

  public static property get NewCustomersActivePolicyGracePeriodMonth_ACC() : int {
    return ScriptParameters.getParameterValue("NewCustomersActivePolicyGracePeriodMonth_ACC") as int
  }

  public static property get MailhouseDocumentUploadDelayMilliseconds_ACC() : int {
    return ScriptParameters.getParameterValue("MailhouseDocumentUploadDelayMilliseconds_ACC") as int
  }

  public static property get ShowERLegacy_ACC() : boolean {
    return ScriptParameters.getParameterValue("ShowERLegacy_ACC") as boolean
  }

}
