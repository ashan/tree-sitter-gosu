package nz.co.acc.gwer.bulkupload

uses nz.co.acc.gwer.bulkupload.processor.BulkAEPExitsProcessor
uses nz.co.acc.gwer.bulkupload.processor.BulkActualRialParametersProcessor
uses nz.co.acc.gwer.bulkupload.xlsprocessor.AbstractXLSProcessor
uses nz.co.acc.plm.integration.bulkupload.BulkUploader
uses org.apache.commons.lang.NotImplementedException
uses org.apache.commons.lang.StringUtils

uses java.io.File

class ERBulkUploader extends BulkUploader {
  protected var _erUpdater : ERBulkUploadProcessUpdater

  construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
    super(uploadFile, uploadFileName, bulkUploadType)
    this._erUpdater = new ERBulkUploadProcessUpdater(uploadFileName, bulkUploadType)
  }

  override function run() {
    executeXLSBulkUpload(_uploadFile, _bulkUploadType, _erUpdater)
  }

  function executeXLSBulkUpload(
      uploadFile : File, bulkUploadType : BulkUploadType_ACC, updater : ERBulkUploadProcessUpdater) {
    final var fn = "executeBulkUpload"
    var csvTypes = {"csv", "txt"}.toTypedArray()
    var xlsTypes = {"xls", "xlsx"}.toTypedArray()
    logInfo(fn, "Processing uploadFile=${uploadFile.Name}, bulkUploadType=${bulkUploadType}")

    if(StringUtils.indexOfAny(uploadFile.Name, csvTypes) > -1) {
      var csvProcessor = getCSVProcessor(bulkUploadType, updater, uploadFile)
      csvProcessor.IsFTPUploaded = this.IsFTPUploaded
      csvProcessor.processCSV()
    } else if(StringUtils.indexOfAny(uploadFile.Name, xlsTypes) > -1) {
      var xlsProcessor = getXLSProcessor(bulkUploadType, updater, uploadFile)
      var result = xlsProcessor.processWorkbook()
    }
  }

  function getXLSProcessor(
      bulkUploadType : BulkUploadType_ACC,
      updater : ERBulkUploadProcessUpdater,
      uploadFile : File) : AbstractXLSProcessor {

    var importer : AbstractXLSProcessor

    if (bulkUploadType == BulkUploadType_ACC.TC_ACTUARIALPARAMETERS) {
      importer = BulkActualRialParametersProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_AEPEXITS) {
      importer = new BulkAEPExitsProcessor(updater, uploadFile)
    }
    else {
      throw new NotImplementedException(bulkUploadType.toString())
    }
    importer.loadWorkbookFromFile()
    return importer
  }
}