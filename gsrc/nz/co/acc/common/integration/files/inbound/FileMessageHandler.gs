package nz.co.acc.common.integration.files.inbound

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.common.integration.files.inbound.utils.InboundFileValidationResponse
uses nz.co.acc.plm.integration.files.inbound.validation.FileValidation

uses java.io.File
uses java.nio.file.Path

/**
 * Managed the creation of the InbndFileMsg_ACC
 * Validate the file
 */
class FileMessageHandler {

  private var _file: File
  private var _filePath: Path
  private var fileName:String
  private var fileValidations: FileValidation

  construct(fileAndPath: java.nio.file.Path) {
    this._filePath = fileAndPath
    this._file = fileAndPath.toFile()
    fileName = this._file.getName().toUpperCase()
    fileValidations = new FileValidation()
  }

  private function getInbndFileMsgType(): InbndFileMsgType_ACC {
    return fileValidations.getInbndFileMsgType(fileName)
  }

  public function hasValidationErrors(): List<String> {
    return fileValidations.hasValidationErrors(fileName, _filePath)
  }

  public function isDocumentControlFile(): boolean {
    return fileValidations.DocumentControlFile
  }

  public function createInbndFileMsg(status: InbndFileMsgStatus_ACC, remarks: InboundFileValidationResponse): InbndFileMsg_ACC {
    var inbndFileMsg = this.createInbndFileMsg()
    if(inbndFileMsg!=null) {
      inbndFileMsg.Status = status
      inbndFileMsg.Remark = remarks.toString()
    }
    return inbndFileMsg
  }

  public function createInbndFileMsg(status: InbndFileMsgStatus_ACC, remarks: String): InbndFileMsg_ACC {
    var inbndFileMsg = this.createInbndFileMsg()
    if(inbndFileMsg!=null) {
      inbndFileMsg.Status = status
      inbndFileMsg.Remark = remarks
    }
    return inbndFileMsg

  }


  public function createInbndFileMsg(): InbndFileMsg_ACC {
    var InbndFileMsg = Query.make(InbndFileMsg_ACC).compare("FileName", Relop.Equals, this._file.getName()).compare("Status", Relop.Equals, InbndFileMsgStatus_ACC.TC_DONE).select().AtMostOneRow
    if (InbndFileMsg != null)
      return null
    else {
      var inbndFileMsg : InbndFileMsg_ACC
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        inbndFileMsg = new InbndFileMsg_ACC()
        inbndFileMsg.FileName = this._file.getName()
        inbndFileMsg.InboundDate = new Date()
        inbndFileMsg.InbndFileMsgType = this.getInbndFileMsgType()
      })
      return inbndFileMsg
    }
  }

  public function createInbndFileMsgForDuplicateFiles(status: InbndFileMsgStatus_ACC, remarks: InboundFileValidationResponse): InbndFileMsg_ACC {

      var inbndFileMsg = new InbndFileMsg_ACC()
      inbndFileMsg.Status = status
      inbndFileMsg.Remark = remarks.toString()

      inbndFileMsg.FileName = this._file.getName()
      inbndFileMsg.InboundDate = new Date()
      inbndFileMsg.InbndFileMsgType = this.getInbndFileMsgType()
      return inbndFileMsg
  }

}
