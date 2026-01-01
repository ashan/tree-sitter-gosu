package nz.co.acc.plm.integration.webservice.document

uses gw.api.gx.GXOptions
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.api.webservice.exception.SOAPException
uses gw.webservice.SOAPUtil
uses gw.xml.ws.annotation.WsiWebService


uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Webservice to get document information.
 */
@WsiWebService("http://acc.co.nz/pc/ws/nz/co/acc/plm/integration/webservice/document/DocumentAPI")
@Export
class DocumentAPI {
  final private static var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  final var _gxOpts = new GXOptions()
  final var _documentAPIUtil = new DocumentAPIUtil()

  construct() {
    _gxOpts.Incremental = false
    _gxOpts.Verbose = false
    _gxOpts.SuppressExceptions = true
  }

  /**
   * This method finds the levy invoice documents associated with the account.
   *
   * @param accountNumber The ACC number
   * @return a list of the documents found
   */
  @Throws(SOAPException, "If communication errors occur")
  @Throws(RequiredFieldException, "If required field is missing")
  @Throws(BadIdentifierException, "If cannot find entity with given identifier")
  @Param("accountNumber", "The number of the Account to be found")
  @Param("policyNumber", "The number of the Policy to be found")
  @Param("levyYear", "The levy year")
  //@WsiPermissions({SystemPermissionType.TC_SEARCHPOLS})
  @Returns("the gxmodel type instance of valid document found, or null if no valid document found")
  function getLevyInvoiceDocuments(
      accountNumber : String,
      policyNumber : String,
      invoiceNumber : String) : List<nz.co.acc.plm.integration.webservice.gxmodel.documentdatamodel.types.complex.DocumentData> {

    SOAPUtil.require(accountNumber, "accountNumber")
    SOAPUtil.require(policyNumber, "policyNumber")
    SOAPUtil.require(invoiceNumber, "invoiceNumber")

    _log.info("getLevyInvoiceDocuments(${accountNumber},${policyNumber},${invoiceNumber}")
    var toReturn : List<nz.co.acc.plm.integration.webservice.gxmodel.documentdatamodel.types.complex.DocumentData> =
        new ArrayList<nz.co.acc.plm.integration.webservice.gxmodel.documentdatamodel.types.complex.DocumentData>()

    var documentList = _documentAPIUtil.getLevyInvoiceDocumentData(accountNumber, policyNumber, invoiceNumber)

    documentList.forEach(\doc -> {
      toReturn.add(new nz.co.acc.plm.integration.webservice.gxmodel.documentdatamodel.DocumentData(doc, _gxOpts).$TypeInstance)
    })
    return toReturn
  }

}