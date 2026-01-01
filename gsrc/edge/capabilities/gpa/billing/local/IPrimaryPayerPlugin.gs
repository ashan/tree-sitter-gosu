package edge.capabilities.gpa.billing.local

uses gw.plugin.billing.BillingContactInfo
uses edge.capabilities.gpa.billing.dto.PrimaryPayerDTO

interface IPrimaryPayerPlugin {

  public function toDTO(primaryPayer : BillingContactInfo) : PrimaryPayerDTO

}
