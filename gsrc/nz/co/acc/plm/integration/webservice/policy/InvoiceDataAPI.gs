package nz.co.acc.plm.integration.webservice.policy

uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.EntityStateException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.api.webservice.exception.SOAPException
uses gw.webservice.SOAPUtil
uses gw.xml.ws.annotation.WsiPermissions
uses gw.xml.ws.annotation.WsiWebService
uses nz.co.acc.plm.integration.webservice.policy.exception.ZeroValueInvoiceException

/**
 * Provides data for Billing Center invoice generation
 * <p>
 * Regenerate wsdl with ./gwb genWsiLocal
 */
@WsiWebService("http://acc.co.nz/pc/ws/nz/co/acc/plm/integration/webservice/policy/InvoiceDataAPI")
@Export
class InvoiceDataAPI {

  @Throws(SOAPException, "If communication errors occur")
  @Throws(RequiredFieldException, "If required field is missing")
  @Throws(BadIdentifierException, "If cannot find transaction with provided transaction ID")
  @Throws(EntityStateException, "If the provided set of transactions do not satisfy invoice generation rules")
  @Throws(ZeroValueInvoiceException, "If the net invoice total is zero")
  @Param("accID", "Account ACCID. Only used to get the account holder address for AEP accounts")
  @Param("provisionalTransactions", "Provisional policy transaction IDs")
  @Param("auditTransactions", "Audit policy transaction IDs")
  @WsiPermissions({SystemPermissionType.TC_SEARCHPOLS})
  @Returns("Array of two gx models [audit,provisional]")
  function getInvoiceData(
      accID : String,
      provisionalTransactions : String[],
      auditTransactions : String[]) : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.types.complex.PolicyPeriod[] {
    SOAPUtil.require(accID, "accID")
    return new InvoiceDataAPIDelegate()
        .getInvoiceData(accID, provisionalTransactions.toList(), auditTransactions.toList())
        .map(\periodGxModel -> periodGxModel?.$TypeInstance)
  }

}
