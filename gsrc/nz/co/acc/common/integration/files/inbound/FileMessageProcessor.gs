package nz.co.acc.common.integration.files.inbound

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.xml.XmlElement

uses java.nio.file.Files

/**
 * Created by fabianr on 17/11/2016.
 */
class FileMessageProcessor {
  private static var _log = StructuredLogger.INTEGRATION_FILE.withClass(FileMessageProcessor)
  private var _bundle : Bundle
  private var _file : java.nio.file.Path
  private var _inbndFileMsg_ACC : InbndFileMsg_ACC
  private var _documentControlFile : boolean
  private static final var GNA = "GNA"

  private static final var ELEMENT_DOCUMENT_ID = "Document_ID"
  private static final var ELEMENT_DOCUMENT_TYPE = "Document_type"
  private static final var ELEMENT_DOCUMENT_DATE = "Document_Date"
  private static final var DOCUMENT_DATE_FORMAT = "yyyyMMdd"

  construct(bundle : Bundle, inbndFileMsg_ACC : InbndFileMsg_ACC, documentControlFile : boolean, file : java.nio.file.Path) {
    this._bundle = bundle
    this._file = file
    this._inbndFileMsg_ACC = inbndFileMsg_ACC
    this._documentControlFile = documentControlFile
  }

  public function run() {
    _log.info(_file.toFile().getName() + "-> start inserting each line to message table")
    if (this._file != null) {
      var fileName = _file.toFile().getName()
      try {
        if (fileName.toUpperCase().startsWith(GNA)) {
          parseGNA()
        } else if (this._documentControlFile == true) {
          var stream = Files.lines(this._file)
          stream.forEach(\line -> {
            createLineMessage(line, fileName, true)
          })
        } else {
          var stream = Files.lines(this._file)
          stream.forEach(\line -> {
            createLineMessage(line, fileName, false)
          })
        }
      } catch (e : Exception) {
        _log.error_ACC(e.getMessage())
      }
    }
    _log.info(_file.toFile().getName() + "-> finished inserting each line to message table")
  }


  /**
   * method to create message
   *
   * @param line
   * @param fileName
   * @param filter,  true requires filter of BOM used by invoice and letter document: false used by GNA
   */
  private function createLineMessage(line : String, fileName : String, filter : boolean) {
    var lineMessage = new LineMessage(line, fileName, filter).create()
    lineMessage.Remark = this._inbndFileMsg_ACC.Remark
    lineMessage.InbndFileMsg = this._inbndFileMsg_ACC
    addHeaderLineEntity(line)
    this._bundle.add(lineMessage)
  }

  /**
   * Adding header line to inbndFileMsg_ACC
   *
   * @param line
   */
  private function addHeaderLineEntity(line : String) {
    if (line.substring(0, 2) == "00") {
      this._inbndFileMsg_ACC.FileHeader = line.toString()
    }
  }

  private function parseGNA() {
    var xmlm = XmlElement.parse(_file.toFile())
    var gnaUpdate = xmlm.$Children.where(\el -> el.$QName.LocalPart == "GNAUpdate")
    for (attrib in gnaUpdate.iterator()) {
      try {
        var docType = attrib.$Children.singleWhere(\elt -> elt.$QName.LocalPart == ELEMENT_DOCUMENT_TYPE.toString())
        var docDate = attrib.$Children.singleWhere(\elt -> elt.$QName.LocalPart == ELEMENT_DOCUMENT_DATE.toString())
        var line = docType.$Text + "~" + attrib.$Children.singleWhere(\elt -> elt.$QName.LocalPart == ELEMENT_DOCUMENT_ID.toString()).$Text + "~" + docDate.$Text
        createLineMessage(line, _file.getFileName().toString(), false)
      } catch (e : Exception) {
        _log.error_ACC(e.getMessage())
      }
    }
  }
}
