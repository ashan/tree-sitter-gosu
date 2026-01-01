package edge.capabilities.gpa.billing

uses edge.capabilities.gpa.billing.dto.AccountBillingDTO

interface IAccountBillingPlugin {

  public function getAccountBillingData(anAccount : Account) : AccountBillingDTO
}
