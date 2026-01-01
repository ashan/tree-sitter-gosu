package nz.co.acc.plm.integration.files.inbound.validation


uses nz.co.acc.common.integration.files.inbound.InboundFileValidator
uses nz.co.acc.common.integration.files.inbound.utils.InboundFileType
uses nz.co.acc.common.integration.files.inbound.utils.InboundFileValidationResponse

uses java.nio.file.Path

/**
 * Created by Nithy on 6/04/2017.
 */
class FileValidation {
  private static var _documentFile : boolean as DocumentControlFile

  public static function getInbndFileMsgType(fileName: String): InbndFileMsgType_ACC {
    _documentFile = true
    if (fileName.startsWith(InboundFileType.GNA.toString())) {
      return InbndFileMsgType_ACC.TC_GNA
    } else if (fileName.toUpperCase().startsWith(InboundFileType.ACC_LEVYINVOICE.toString())) {
      _documentFile = true
      return InbndFileMsgType_ACC.TC_ACC_LEVYINVOICE
    } else if (fileName.toUpperCase().startsWith(InboundFileType.ACC_LETTERS.toString())) {
      _documentFile = true
      return InbndFileMsgType_ACC.TC_ACC_LETTERS
    } else if (fileName.toUpperCase().startsWith(InboundFileType.DELETE_DOCUMENTS.toString())) {
      _documentFile = true
      return InbndFileMsgType_ACC.TC_DELETE_DOCUMENTS
    }
    return null
  }

  public function hasValidationErrors(fileName: String, _filePath: Path): List<String> {
    var fileMsgType = getInbndFileMsgType(fileName)
    var fileValidation: InboundFileValidator
    if (fileMsgType == InbndFileMsgType_ACC.TC_GNA) {
      fileValidation = new GNAUpdateFileValidation(_filePath)
    } else if (fileMsgType == InbndFileMsgType_ACC.TC_ACC_LEVYINVOICE) {
      fileValidation = new MailhouseDocumentsValidation(_filePath)
    } else if (fileMsgType == InbndFileMsgType_ACC.TC_ACC_LETTERS) {
      fileValidation = new MailhouseDocumentsValidation(_filePath)
    } else if (fileMsgType == InbndFileMsgType_ACC.TC_DELETE_DOCUMENTS) {
      fileValidation = new MailhouseDocumentsValidation(_filePath)
    } else {
      return {InboundFileValidationResponse.INVALID_FILE.toString()}
    }
    return fileValidation.hasErrors()
  }
}