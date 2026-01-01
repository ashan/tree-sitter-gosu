package nz.co.acc.integration.mailhouse

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.nio.file.Path
uses java.nio.file.Paths

class MailhouseFileUtil {
  final static var LOG = StructuredLogger_ACC.INTEGRATION.withClass(MailhouseFileUtil)

  static function getMailhouseWorkingDir() : Path {
    return Paths.get(ConfigurationProperty.MAILHOUSE_PROCESS_DIRECTORY.PropertyValue)
  }

  static function metadataFileName(zipFileName : String) : String {
    return fileNameWithoutExtension(zipFileName) + ".txt"
  }

  static function fileNameWithoutExtension(zipFileName : String) : String {
    var lastIndex = zipFileName.lastIndexOf(".")
    return zipFileName.substring(0, lastIndex)
  }

  static function getDocumentType(mailhouseFileType : MailhouseFileType_ACC) : DocumentType {
    switch (mailhouseFileType) {
      case MailhouseFileType_ACC.TC_LEVYINVOICEWM:
      case MailhouseFileType_ACC.TC_LEVYINVOICENZ:
        return DocumentType.TC_LEVY_INVOICE
      default:
        return DocumentType.TC_LETTER_SENT
    }
  }

  static function getFilePath(record : MailhouseStaging_ACC) : Path {
    var zipFileName = record.MailhouseFile.FileName
    var pdfFileName = record.FileName
    var baseDir = MailhouseFileUtil.getMailhouseWorkingDir()
    var subDir = MailhouseFileUtil.fileNameWithoutExtension(zipFileName)
    return baseDir.resolve(subDir).resolve(pdfFileName)
  }

  static function getFilenamePrefix(fileType : MailhouseFileType_ACC) : String {
    switch (fileType) {
      case MailhouseFileType_ACC.TC_LETTERWMBC:
        return "ACC-Letter-WM-BC"
      case MailhouseFileType_ACC.TC_LETTERWMPC:
        return "ACC-Letter-WM-PC"
      case MailhouseFileType_ACC.TC_LETTERWMER:
        return "ACC-Letter-WM-ER"
      case MailhouseFileType_ACC.TC_LEVYINVOICENZ:
        return "ACC-LevyInvoice-NZ"
      case MailhouseFileType_ACC.TC_LEVYINVOICEWM:
        return "ACC-LevyInvoice-WM"
      default:
        return ""
    }
  }

}