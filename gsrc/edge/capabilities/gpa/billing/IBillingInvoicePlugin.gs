package edge.capabilities.gpa.billing

uses edge.capabilities.gpa.billing.dto.BillingInvoiceDTO
uses gw.plugin.billing.BillingInvoiceInfo

interface IBillingInvoicePlugin {

  public function toDTO(aBillingInvoiceInfo : BillingInvoiceInfo) : BillingInvoiceDTO
  public function toDTOArray(billingInvoiceInfos : BillingInvoiceInfo[]) : BillingInvoiceDTO[]
  public function getAccountBillingInvoices(anAccount : Account) : BillingInvoiceDTO[]

}
