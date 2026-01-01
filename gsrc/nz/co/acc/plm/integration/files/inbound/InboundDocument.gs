package nz.co.acc.plm.integration.files.inbound

/**
 * Created by Nithy on 3/05/2017.
 */
class InboundDocument {

  private var _fileName: String as Filename
  private var _invoiceNumber: String as InvoiceNumber
  private var _date: Date as Date
  private var _accId: String as  ACCID
  private var _policyNumber: String as  PolicyNumber
  private var _spGuid: String as SP_GUID
  private var _docType: DocumentType as DocType

}