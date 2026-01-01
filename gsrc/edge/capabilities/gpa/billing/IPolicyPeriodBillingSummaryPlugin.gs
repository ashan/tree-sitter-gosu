package edge.capabilities.gpa.billing

uses edge.capabilities.gpa.billing.dto.PolicyPeriodBillingSummaryDTO
uses edge.capabilities.gpa.billing.dto.BillingInvoiceDTO

interface IPolicyPeriodBillingSummaryPlugin {

  public function getAccountBilledOwnedPolicies(anAccount : Account) : PolicyPeriodBillingSummaryDTO []
  public function getAccountBilledUnownedPolicies(anAccount : Account) : PolicyPeriodBillingSummaryDTO []
  public function getPolicyPeriodBillingSummariesForPolicy(aPolicy : Policy) : PolicyPeriodBillingSummaryDTO []
  public function getPolicyInvoicesForAccount(anAccount : Account) : BillingInvoiceDTO []

}
