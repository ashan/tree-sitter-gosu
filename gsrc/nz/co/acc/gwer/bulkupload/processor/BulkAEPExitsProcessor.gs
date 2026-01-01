package nz.co.acc.gwer.bulkupload.processor

uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.gwer.bulkupload.ERBulkUploadProcessUpdater
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERAEPClaimsProcessor
uses nz.co.acc.gwer.bulkupload.sheetprocessor.ERAEPExitsProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSSheetProcessor
uses org.apache.commons.lang.NotImplementedException
uses org.apache.poi.ss.usermodel.Sheet

uses java.io.File

class BulkAEPExitsProcessor extends AbstractXLSProcessor {

  construct(updater : ERBulkUploadProcessUpdater, uploadFile : File) {
    super(updater, uploadFile)
    _log = StructuredLogger_ACC.CONFIG.withClass(this)
  }

  override function getSheetProcessor(sheet : Sheet) : AbstractXLSSheetProcessor {
    var sheetProcessor: AbstractXLSSheetProcessor = null
    switch (sheet.SheetName) {
      case ERAEPExitsProcessor.SHEET_NAME:
        sheetProcessor = new ERAEPExitsProcessor(_updater, sheet)
        break
      case ERAEPClaimsProcessor.SHEET_NAME:
        sheetProcessor = new ERAEPClaimsProcessor(_updater, sheet)
        break
      default:
    }
    if(sheetProcessor == null) throw new NotImplementedException(sheet.SheetName)
    _log.info("Sheet name ${sheet.SheetName}, processor ${sheetProcessor?.Class.Name}")
    return sheetProcessor
  }
}