package edge.capabilities.gpa.billing

uses edge.capabilities.gpa.billing.dto.AccountBillingSummaryDTO
uses gw.plugin.billing.BillingAccountInfo

interface IAccountBillingSummaryPlugin {


  public function getAccountBillingSummary(account : Account) : AccountBillingSummaryDTO
}
