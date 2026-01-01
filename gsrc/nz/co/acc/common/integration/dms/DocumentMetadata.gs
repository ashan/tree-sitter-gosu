package nz.co.acc.common.integration.dms

uses gw.plugin.util.CurrentUserUtil

/**
 * This class represents the metadata of the Sharepoint document.
 * <p>
 * Created by Nick on 9/03/2017.
 */
class DocumentMetadata {

  var _accID: String as ACC_ID = null
  var _taxInvoiceNumber: String as TaxInvoiceNumber = null
  var _status: String as Status = null
  var _userID: String as UserID = null

  construct(userID:String) {
    _userID = userID
  }

  construct(userID:String, document: Document) {
    this(userID)
    _accID = document.getAccID()
    _status = "New"
  }

  construct(userID: String, accID: String, taxInvoiceNumber: String) {
    this(userID)
    _accID = accID
    _taxInvoiceNumber = taxInvoiceNumber
  }

  construct(userID: String, status:String) {
    this(userID)
    _status = status
  }
}