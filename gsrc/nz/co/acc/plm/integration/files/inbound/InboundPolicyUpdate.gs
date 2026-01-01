package nz.co.acc.plm.integration.files.inbound


/**
 * Created by Nithy on 14/02/2017.
 */
class InboundPolicyUpdate {
  private var _fileDocumentID: String as FileDocumentID
  private var _documentID: String as DocumentID
  private var _documentType: String as DocumentType
  private var _documentDate: Date as DocumentDate

  public function toEntity(): GNAInboundData_ACC {
    var gnaUpdateData = new GNAInboundData_ACC()
    gnaUpdateData.FileDocumentID = this._fileDocumentID
    gnaUpdateData.DocumentID= this._documentID
    gnaUpdateData.DocumentType = this._documentType
    gnaUpdateData.DocumentDate = this._documentDate
    return gnaUpdateData
  }
}