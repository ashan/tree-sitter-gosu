package nz.co.acc.integration.junoinformationservice.payloadgenerator.document

uses gw.api.system.server.ServerUtil
uses nz.co.acc.integration.junoinformationservice.model.document.GSONDocument

class DocumentGsonGenerator {

  function generate(entity: Document) : GSONDocument {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONDocument()
    gsonDoc.id = entity.DocUID
    gsonDoc.updateTime = entity.UpdateTime.toISOTimestamp()
    gsonDoc.accId = entity.Account.ACCID_ACC // preupdate rule guarantees Account is not null
    gsonDoc.author = entity.Author
    gsonDoc.description = entity.Description
    gsonDoc.docUid = entity.DocUID
    gsonDoc.documentType = entity.Type.DisplayName
    gsonDoc.invoiceDate = entity.InvoiceDate?.toISODate()
    gsonDoc.invoiceNumber = entity.TaxInvoiceNumber_ACC
    gsonDoc.mimeType = entity.MimeType
    gsonDoc.name = entity.Name
    gsonDoc.policyNumber = entity.Policy?.LatestPeriod?.PolicyNumber
    gsonDoc.publicId = entity.PublicID
    gsonDoc.recipient = entity.Recipient
    gsonDoc.securityType = entity.SecurityType.DisplayName
    gsonDoc.status = entity.Status.DisplayName
    gsonDoc.pcServerId = ServerUtil.ServerId
    gsonDoc.pcEventTime = new Date().toISOTimestamp()
    return gsonDoc
  }
}