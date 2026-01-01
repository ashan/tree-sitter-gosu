package edge.capabilities.gpa.billing

uses edge.capabilities.gpa.billing.dto.PolicyBillingSummaryDTO

interface IPolicyBillingSummaryPlugin {

  public function getPolicyBillingSummary(aPolicy : Policy) : PolicyBillingSummaryDTO

}
