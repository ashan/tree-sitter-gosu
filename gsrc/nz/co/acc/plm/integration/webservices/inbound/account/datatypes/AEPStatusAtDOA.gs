package nz.co.acc.plm.integration.webservices.inbound.account.datatypes

uses gw.xml.ws.annotation.WsiExportable

/**
 * Represents a result for the AccreditedEmployerAPI webservice
 */
@WsiExportable("http://guidewire.com/pc/nz/co/acc/plm/integration/webservices/inbound/AEPStatusAtDOA")
final class AEPStatusAtDOA {
  var policyAEPatDOA: Boolean as PolicyAEPAtDOA = false
  var policyValidForClaimsAtDOA: Boolean as PolicyValidForClaimsAtDOA = false
  var primeEmployerACCIDatDOA: String as PrimeEmployerACCIDAtDOA = null
}