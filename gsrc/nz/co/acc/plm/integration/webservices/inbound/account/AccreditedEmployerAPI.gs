package nz.co.acc.plm.integration.webservices.inbound.account

uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.GosuStringUtil
uses gw.xml.ws.annotation.WsiWebService
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.integration.webservices.inbound.account.datatypes.ACCIDAndSuffix
uses nz.co.acc.plm.integration.webservices.inbound.account.datatypes.AEPStatusAtDOA


/**
 * AccreditedEmployerAPI is the WebService Endpoint for the IIB client to retrieve historical AEP status of an employer
 * [host]/pc/ws/nz/co/acc/plm/integration/webservices/inbound/account/AccreditedEmployerAPI?WSDL.
 */
@WsiWebService("http://guidewire.com/pc/ws/nz/co/acc/plm/integration/webservices/inbound/account/accreditedemployerapi")
class AccreditedEmployerAPI {
  private final var LOG = StructuredLogger.CONFIG.withClass(this)

  /**
   * Database access layer
   * <p>
   * Can be modified to return new instance on each call, which is useful for debugging
   */
  property get DAO() : AccountAPIDAO {
    return new AccountAPIDAO()
  }

  function getAEPStatusAtDOA(accEmployerID : String, dateOfAccident : String) : AEPStatusAtDOA {
    LOG.info("getAEPStatusAtDOA: accEmployerID='${accEmployerID}', dateOfAccident='${dateOfAccident}'")
    validateArguments(accEmployerID, dateOfAccident)

    var accIdAndSuffix = new ACCIDAndSuffix(accEmployerID)
    assertAccountExists(accIdAndSuffix)

    var doa = DateUtil_ACC.fromISOString(dateOfAccident)

    var result = new AEPStatusAtDOA()
    result.PrimeEmployerACCIDAtDOA = accEmployerID
    result.PolicyAEPAtDOA = false
    result.PolicyValidForClaimsAtDOA = false

    DAO.findPolicyPeriodAtDateOfAccident(accIdAndSuffix, doa).each(\period -> {
      result.PolicyAEPAtDOA = period.IsAEPMemberPolicy_ACC
      result.PolicyValidForClaimsAtDOA = period.PolicyTerm.ValidForClaimsReg_ACC
      if (LOG.DebugEnabled) {
        LOG.debug("Found original policy period ${period.ACCPolicyID_ACC} validForClaims=${result.PolicyValidForClaimsAtDOA}, isAEPMember=${result.PolicyAEPAtDOA}, ID=${period.ID}, editEffectiveDate=${period.EditEffectiveDate}, periodEnd=${period.PeriodEnd}")
      }

      if (result.PolicyAEPAtDOA) {
        var primeACCID = findAEPPrimeAtDOA(period, doa)
        if (primeACCID != null) {
          findAEPPolicyPeriodForPrime(primeACCID, doa).each(\primePeriod -> {
            if (LOG.DebugEnabled) {
              LOG.debug("Found prime policy period ${primePeriod.ACCPolicyID_ACC} validForClaims=${result.PolicyValidForClaimsAtDOA}, ID=${primePeriod.ID}, editEffectiveDate=${primePeriod.EditEffectiveDate}, periodEnd=${primePeriod.PeriodEnd}")
            }
            if (primePeriod.PolicyTerm.ValidForClaimsReg_ACC) {
              result.PrimeEmployerACCIDAtDOA = primePeriod.ACCPolicyID_ACC
              result.PolicyValidForClaimsAtDOA = true
            }
          })
        } else {
          LOG.warn_ACC("Cannot find AEP prime account for accEmployerID=${accEmployerID}, dateOfAccident=${dateOfAccident}, policyPeriod=${period}")
        }
      }
    })

    return result
  }

  private function validateArguments(accEmployerID : String, dateOfAccident : String) {
    if (GosuStringUtil.isBlank(accEmployerID)) {
      throw new RuntimeException("accEmployerId is required")
    }
    if (dateOfAccident == null) {
      throw new RuntimeException("dateOfAccident is required")
    }
  }

  private function assertAccountExists(accIdAndSuffix : ACCIDAndSuffix) {
    var account = DAO.findAccountByACCID(accIdAndSuffix.ACCID)
    if (!account.Present) {
      throw new RuntimeException("Account not found with ACC ID '${accIdAndSuffix.ACCID}'")
    }
  }

  private function findAEPPolicyPeriodForPrime(primeACCID : String, dateOfAccident : Date) : Optional<PolicyPeriod> {

    var primeWithESuffix = new ACCIDAndSuffix(primeACCID, "E")
    var optionalPeriod = DAO.findPolicyPeriodAtDateOfAccident(primeWithESuffix, dateOfAccident)
    if (optionalPeriod.isPresent() && optionalPeriod.get().IsAEPMemberPolicy_ACC) {
      return optionalPeriod
    }

    var primeWithDSuffix = new ACCIDAndSuffix(primeACCID, "D")
    optionalPeriod = DAO.findPolicyPeriodAtDateOfAccident(primeWithDSuffix, dateOfAccident)
    if (optionalPeriod.isPresent() && optionalPeriod.get().IsAEPMemberPolicy_ACC) {
      return optionalPeriod
    }

    return Optional.empty()
  }

  private function findAEPPrimeAtDOA(policyPeriod : PolicyPeriod, dateOfAccident : Date) : String {
    var optionalAEPPrimeAccountNumber = policyPeriod.getAEPPrimeMemberAccountAtDate_ACC(dateOfAccident)
    if (optionalAEPPrimeAccountNumber.isPresent()) {
      return optionalAEPPrimeAccountNumber.get().ACCID_ACC
    } else {
      return null
    }
  }

}
