package nz.co.acc.plm.integration.webservice.document

/**
 * Document Data.
 */
@gw.xml.ws.annotation.WsiExportable("http://acc.co.nz/pc/ws/nz/co/acc/plm/integration/webservice/document/DocumentData")
@Export
class DocumentData {
  var _name: String as Name
  var _docUID: String as DocUID
  var _invoiceDate: Date as InvoiceDate
  var _invoiceNumber: String as InvoiceNumber
  var _mimeType: String as MimeType

  construct(document : Document) {
    _name = document.Name
    _docUID = document.DocUID
    _invoiceDate = document.InvoiceDate
    _invoiceNumber = document.TaxInvoiceNumber_ACC
    _mimeType = document.MimeType
  }

}