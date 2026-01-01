package edge.capabilities.gpa.claim

uses edge.capabilities.gpa.claim.dto.ClaimSummaryDTO

interface IClaimSummaryPlugin {

  public function getAccountClaims(anAccount : Account) : ClaimSummaryDTO[]
  public function getPolicyClaims(aPolicyPeriod : PolicyPeriod) : ClaimSummaryDTO[]
}
