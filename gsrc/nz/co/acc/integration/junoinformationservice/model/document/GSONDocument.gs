package nz.co.acc.integration.junoinformationservice.model.document

uses nz.co.acc.integration.junoinformationservice.model.AbstractDocument

/**
 * Created by Mike Ourednik on 4/06/20.
 */
class GSONDocument extends AbstractDocument {
  public var accId: String
  public var author : String
  public var description : String
  public var docUid : String
  public var documentType : String
  public var invoiceDate : String
  public var invoiceNumber : String
  public var mimeType : String
  public var name : String
  public var policyNumber : String
  public var publicId : String
  public var recipient : String
  public var securityType : String
  public var status : String
  public var updateTime: String
}