package nz.co.acc.common.integration.bulkupload

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor


uses java.io.File

/**
 * Handles an uploaded CSV file and starts the process of importing contacts.
 * <p>
 * Created by OurednM on 13/06/2018.
 * ChrisA 02/10/2018 US12192 process Migrated Policy Holds
 */
abstract class AbstractBulkUploader {
  private static var _log = StructuredLogger.INTEGRATION.withClass(AbstractBulkUploader)

  protected var _uploadFile : File
  protected var _bulkUploadType : BulkUploadType_ACC
  protected var _updater : BulkUploadProcessUpdater
  private var _ftpUploaded : Boolean

  construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
    this._uploadFile = uploadFile
    this._bulkUploadType = bulkUploadType
    this._updater = new BulkUploadProcessUpdater(uploadFileName, bulkUploadType)
    this._ftpUploaded = Boolean.FALSE
  }

  function getUUID() : String {
    return _updater.getUUID()
  }

  function getBulkUploadProcess() : BulkUploadProcess_ACC {
    return Query.make(BulkUploadProcess_ACC)
        .compare(BulkUploadProcess_ACC#uuid, Relop.Equals, getUUID())
        .select()
        .single()
  }

  property set IsFTPUploaded(ftpUploaded:Boolean) {
    _ftpUploaded = ftpUploaded
  }

  property get IsFTPUploaded() : Boolean {
    return _ftpUploaded
  }

  function run() {
    executeBulkUpload(_uploadFile, _bulkUploadType, _updater)
  }

  abstract protected function getCSVProcessor(
      bulkUploadType : BulkUploadType_ACC,
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : AbstractCSVProcessor

  /**
   * Returns either the number of imported contacts or the errors found during parsing
   *
   * @param uploadFile
   * @param bulkUploadType
   * @return
   */
  function executeBulkUpload(
      uploadFile : File, bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater) {

    final var fn = "executeBulkUpload"

    logInfo(fn, "Processing uploadFile=${uploadFile.Name}, bulkUploadType=${bulkUploadType}")

    var csvProcessor = getCSVProcessor(bulkUploadType, updater, uploadFile)
    csvProcessor.IsFTPUploaded = this.IsFTPUploaded
    csvProcessor.processCSV()
  }

  function logInfo(fn : String, msg : String) {
    _log.info(msg)
  }

  function logError(fn : String, msg : String, e : Exception) {
    _log.error_ACC(msg,e)
  }

}