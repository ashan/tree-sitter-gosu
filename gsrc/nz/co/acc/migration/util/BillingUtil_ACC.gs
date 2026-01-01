package nz.co.acc.migration.util

uses gw.plugin.billing.InstallmentPlanDataImpl
uses gw.plugin.billing.PaymentPlanData

/**
 * The methods in this class help PC running with BC\CM.
 */
class BillingUtil_ACC {

  private static var standalonePCEnabled : Boolean = false

  /**
   * This is a switch to turn on/off BC WebServices...
   *
   * @return True if we want to run PC in a stand alone mode...
   */
  public static function isStandAlonePC() : boolean {
    return standalonePCEnabled or !ScriptParameters.EnableIntegrationBillingSystem_ACC
  }

  public static function enableStandalonePC() {
    BillingUtil_ACC.standalonePCEnabled = true
  }

  /**
   * Return default PaymentPlayData for StandAlone PC
   */
  public static function mockPaymentPlan() : PaymentPlanData {
    var result = new InstallmentPlanDataImpl()
    result.BillingId = "acc_pp:1"
    result.Name = "Annual Payment"
    result.AllowedPaymentMethods = {AccountPaymentMethod.TC_OTHER_ACC, AccountPaymentMethod.TC_DIRECTDEBIT_ACC}
    result.InvoiceFrequency = BillingPeriodicity.TC_EVERYYEAR
    return result
  }

}
