package edge.capabilities.gpa.claim

uses edge.capabilities.gpa.claim.dto.ClaimSummaryDTO
uses java.util.Date
uses java.lang.Exception
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses gw.plugin.claimsearch.NoResultsClaimSearchException

class DefaultClaimSummaryPlugin implements IClaimSummaryPlugin {

  private static var LOGGER = new Logger(Reflection.getRelativeName(DefaultClaimSummaryPlugin))

  @ForAllGwNodes
  construct(){}

  override function getAccountClaims(anAccount: Account): ClaimSummaryDTO[] {
    final var claims = getClaimsForAccount(anAccount)

    return toDTOArray(claims)
  }

  override function getPolicyClaims(aPolicyPeriod: PolicyPeriod): ClaimSummaryDTO[] {
    final var claims = getClaimsForPolicyPeriod(aPolicyPeriod)

    return toDTOArray(claims)
  }

  protected function toDTO(aClaim : Claim) : ClaimSummaryDTO{
    final var dto = new ClaimSummaryDTO()
    dto.ClaimNumber = aClaim.ClaimNumber
    dto.PolicyNumber = aClaim.PolicyPeriod.PolicyNumber
    dto.Product = aClaim.PolicyPeriod.Policy.Product.DisplayName
    dto.LossDate = aClaim.LossDate
    dto.Status = aClaim.Status

    return dto
  }

  protected function toDTOArray(claims : Claim[]) : ClaimSummaryDTO[]{
    if(claims != null && claims.HasElements){
      return claims.map( \ aClaim -> toDTO(aClaim))
    }

    return new ClaimSummaryDTO[]{}
  }

  protected function getClaimsForPolicyPeriod(aPolicyPeriod : PolicyPeriod) : Claim[]{
    try{
      final var searchCriteria = aPolicyPeriod.getNewClaimSearchCriteria(true)
      searchCriteria.DateCriteria.StartDate = Date.Today.addYears(-2)

      final var aClaimSet = searchCriteria.performSearch()

      return aClaimSet.Claims
    }catch(ex : NoResultsClaimSearchException){
      if(LOGGER.debugEnabled()){
        LOGGER.logWarn(ex)
      }
    }catch(ex : Exception){
        LOGGER.logError(ex)
    }

    return null
  }

  protected function getClaimsForAccount(anAccount: Account) : Claim[]{
    try{
      final var searchCriteria = anAccount.getNewClaimSearchCriteria()
      searchCriteria.DateCriteria.StartDate = Date.Today.addYears(-2)

      final var aClaimSet = searchCriteria.performSearch()

      return aClaimSet.Claims
    } catch(ex : NoResultsClaimSearchException){
      if(LOGGER.debugEnabled()){
        LOGGER.logWarn(ex)
      }
    }

    return null
  }
}
