package nz.co.acc.common.integration.files.outbound

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.webservice.exception.SOAPException
uses gw.processes.BatchProcessBase
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.transaction.Transaction
uses gw.util.GosuStringUtil
uses gw.xml.ws.WebServiceException
uses nz.co.acc.common.integration.files.outbound.errorhandling.ErrorHandlingHelper
uses nz.co.acc.common.integration.files.outbound.exceptions.CorrespondenceGNAException
uses nz.co.acc.common.integration.files.outbound.exceptions.FileOutboundFailedException
uses nz.co.acc.common.integration.files.outbound.exceptions.RecordOutboundFailedException
uses nz.co.acc.plm.integration.files.outbound.FileTransformerFactory
uses nz.co.acc.plm.integration.files.outbound.RecordTransformerFactory
uses org.apache.commons.io.FileExistsException

uses java.io.IOException
uses java.io.OutputStream
uses java.io.PrintWriter
uses java.nio.file.FileSystems
uses java.nio.file.Files
uses java.nio.file.Path
uses java.nio.file.StandardCopyOption
uses java.nio.file.StandardOpenOption

/**
 * This is the base class for all Outbound File batch processes.
 * Use the BatchProcessType to declare a type of batch process for each type of outbound file.
 * <p>
 * Created by Nick on 22/11/2016.
 */
class BaseOutboundFileBatchProcess extends BatchProcessBase {
  private static var _log = StructuredLogger.INTEGRATION.withClass(BaseOutboundFileBatchProcess)
  protected var _fileTransformer : BaseOutboundFileTransformer
  protected var _outboundHeader : OutBoundHeader_ACC
  protected var _stats : FileStatistics = new FileStatistics()

  construct(batchProcessType : BatchProcessType) {
    super(batchProcessType)
  }

  override function doWork() {
    _log.info("Outbound Batch ${getType().getCode()} started")
    _fileTransformer = FileTransformerFactory.getFileTransformer(getType())
    createInitialHeader()
    try {
      transformOutboundRecords()
      processOutboundRecordsToFile()
    } catch (ex : Exception) {
      _log.error_ACC("Outbound Batch Run failed for BatchType=${getType().getCode()}, ${getType().getDescription()}", ex)
      Transaction.runWithNewBundle(\newBundle -> {
        _outboundHeader = newBundle.add(_outboundHeader)
        _outboundHeader.errored(_stats)
        ErrorHandlingHelper.createBatchFailedActivity(newBundle, _outboundHeader, ex)
      })
    } finally {
      _log.info("Outbound Batch ${getType().getCode()} finished")
    }
  }

  /**
   * Stage 1 of batch process
   * - generate OutboundRecordHeader for this batch run
   * - convert "New" outboundRecord data to data output for this batch type
   * - assign Header to outbound record data and change status to "Processed" when converted successfully
   * - update statistic data to outboundRecordHeader
   */
  protected function transformOutboundRecords() {
    var numOfRecordsConvertedSuccessfully = 0
    var numOfRecordsConversionErrored = 0
    var numOfRecordsWithInvalidAddress = 0

    var results = findOutboundRecordsToConvert()
    var total = results.Count

    for (outboundRecord in results index i) {
      if ((i + 1) % 100 == 0) {
        _log.info("transformOutboundRecords: ${i + 1} of ${total}")
      }
      var dataOutput : String = null
      try {
        var recordTransformer = RecordTransformerFactory.getRecordTransformer(outboundRecord.Type)
        dataOutput = recordTransformer.transformXMLToFileFormat(
            outboundRecord.Data,
            outboundRecord.AccountNumber,
            AddressPolicyType_ACC.get(outboundRecord.PolicyAdressType))
        // Precaution: Validate dataOutput. It shouldn't happen but ensure there is converted data to be saved,
        // otherwise it's wrong to move the record to converted state when there is no data output.
        if (GosuStringUtil.isBlank(dataOutput)) {
          throw new RecordOutboundFailedException("OutboundRecord failed to convert because dataOutput is blank, ID=${outboundRecord.ID}, recordType=${outboundRecord.getType()}")
        }
      } catch (e : CorrespondenceGNAException) {
        //for address not found, do not raise activity, but log the info and increase the counter
        _log.debug("outboundRecord is GNA: id=${outboundRecord.ID}")
        Transaction.runWithNewBundle(\newBundle -> {
          outboundRecord = newBundle.add(outboundRecord)
          outboundRecord.Status = OutBoundRecordStatus_ACC.TC_INVALID_ADDRESS
        })
        numOfRecordsWithInvalidAddress++

      } catch (e : SOAPException) {
        _log.error_ACC("Unexpected error occurred loading address from Policy Center for OutboundRecord id=${outboundRecord.ID}", e)
        var exception = new RecordOutboundFailedException("The Outbound Record failed to load address, recordType=${outboundRecord.Type}, ID=${outboundRecord.ID}")
        handleError(outboundRecord, exception)
        numOfRecordsConversionErrored++

      } catch (e : WebServiceException) {
        _log.error_ACC("Unexpected error occurred loading address from Policy Center for OutboundRecord id=${outboundRecord.ID}", e)
        var exception = new RecordOutboundFailedException("The Outbound Record failed to load address, recordType=${outboundRecord.Type}, ID=${outboundRecord.ID}")
        handleError(outboundRecord, exception)
        numOfRecordsConversionErrored++

      } catch (e : Exception) {
        _log.error_ACC("Unexpected error occurred transforming outbound records XML to file format for OutboundRecord id=${outboundRecord.ID}", e)
        var exception = new RecordOutboundFailedException("The Outbound Record failed to be converted, recordType=${outboundRecord.Type}, ID=${outboundRecord.ID} : ${e.Message}")
        handleError(outboundRecord, exception)
        numOfRecordsConversionErrored++
      }

      if (GosuStringUtil.isNotBlank(dataOutput)) {
        Transaction.runWithNewBundle(\newBundle -> {
          outboundRecord = newBundle.add(outboundRecord)
          outboundRecord.setAsConverted(dataOutput)
        })
        numOfRecordsConvertedSuccessfully++
      }
      _log.info("transformOutboundRecords completed. Total=${total}")
    }

    // Update header with statistics for finishing conversion.
    Transaction.runWithNewBundle(\newBundle -> {
      _outboundHeader = newBundle.add(_outboundHeader)
      _outboundHeader.converted(numOfRecordsConvertedSuccessfully, numOfRecordsConversionErrored, numOfRecordsWithInvalidAddress)
    })

  }

  private function handleError(outboundRecord : OutBoundRecord_ACC, exception : Exception) {
    Transaction.runWithNewBundle(\newBundle -> {
      outboundRecord = newBundle.add(outboundRecord)
      outboundRecord.setAsConvertingError(exception)
      ErrorHandlingHelper.createRecordFailedActivity(newBundle, _outboundHeader, outboundRecord, exception)
    })
  }

  /**
   * Stage 2 of batch process
   */
  private function processOutboundRecordsToFile() {
    //produce file
    beforeOutboundFileProcessed()
    var processingFileName = _fileTransformer.generateOutputFilename()
    var processingFilePath = createAProcessingFilePath(processingFileName)

    _log.info("processOutboundRecordsToFile ${processingFilePath}")

    var fos : OutputStream
    var writer : PrintWriter
    try {
      fos = Files.newOutputStream(processingFilePath, {StandardOpenOption.CREATE_NEW})
      writer = new PrintWriter(fos)
      writingHeader(writer)
      writeRecords(processingFileName, writer)
      writingTrailer(writer)
    } catch (ex : FileOutboundFailedException) {
      if (Files.exists(processingFilePath, {})) {
        moveFile(processingFilePath, getErrorFolderPath())
      }
      throw ex
    } finally {
      closeFile(writer, fos)
    }
    moveFileToDoneFolder(processingFilePath)

    this.createReport()

    if (_fileTransformer.HasControlFile) {
      produceControlFile()
    }

    afterOutboundFileProcessed(processingFileName)

    _log.info("processOutboundRecordsToFile completed")
  }

  protected function produceControlFile() {
    var controlFileName = "${_fileTransformer.fileName.split("\\.", 2).first()}${_fileTransformer.ControlFileSuffix}"
    var processingFilePath = createAProcessingFilePath(controlFileName)
    var fos = Files.newOutputStream(processingFilePath, {StandardOpenOption.CREATE_NEW})
    fos.close()
    moveFile(processingFilePath, getDoneFolderPath())
  }

  /**
   * This method should be called at the end of the batch process.
   * It performs any customised batch behaviour implemented in the File Transformer, for example, reports or setting disbursments to issued status.
   */
  function postBatch() {
    var funcName = "postBatchFile"
    try {
      // It is important this is not inside the Try block of the first Stage 2 processing. This bit of code is after successful Stage 2.
      _fileTransformer.postBatchFile(_outboundHeader)
    } catch (e : Exception) {
      _log.error_ACC("An unexpected error occured at the very end of Stage 2 batch, BatchType=${getType().getCode()}, ${getType().getDescription()}", e)
    }
  }

  /**
   * The batch has finished it's work. Update the Header record completed with stats and move file to done folder.
   *
   * @param processingFilePath
   * @param records
   */
  protected function moveFileToDoneFolder(processingFilePath : Path) : void {

    var doneFilePath : Path = null
    var processedFileName : String = null

    final var doneFolderPath = getDoneFolderPath()
    processedFileName = processingFilePath.FileName.toString()

    // Moving processing file to outgoing done folder.
    try {
      Transaction.runWithNewBundle(\newBundle -> {
        var editableOutboundHeader = newBundle.add(_outboundHeader)
        editableOutboundHeader.completed(processedFileName, _stats)
        _outboundHeader = editableOutboundHeader
      })

      // Even if records.Processed==0, we still want to send the file to Done folder. Confirmed with business this is happenning today already.
      doneFilePath = moveFile(processingFilePath, doneFolderPath)
    } catch (ex : Exception) {
      if (processingFilePath != null) {
        moveFile(processingFilePath, getErrorFolderPath())
      }
      if (doneFilePath != null) {
        moveFile(doneFilePath, getErrorFolderPath())
      }
      throw new FileOutboundFailedException("Unexpected error occured trying to update header status to complete or move file to 'Done' folder.", ex)
    }
  }

  protected function writingHeader(writer : PrintWriter) : void {
    try {
      final var headerLine = _fileTransformer.buildHeaderLineForFile()
      if (headerLine != null) {
        writer.println(headerLine)
      }
    } catch (headerEx : Exception) {
      throw new FileOutboundFailedException("Writing headerline to file failed.", headerEx)
    }
  }

  protected function writingTypeHeader(writer : PrintWriter, type : OutBoundRecordType_ACC) : void {
    try {
      final var typeHeaderLine = _fileTransformer.buildTypeHeaderLine(type)
      if (typeHeaderLine != null) {
        writer.println(typeHeaderLine)
      }
    } catch (ex : Exception) {
      throw new FileOutboundFailedException("Writing ${type}  type header line to file failed.", ex)
    }
  }

  private function writingTypeFooter(writer : PrintWriter, type : OutBoundRecordType_ACC, count : int) : void {
    try {
      final var typeHeaderLine = _fileTransformer.buildTypeFooterLine(type, count)
      if (typeHeaderLine != null) {
        writer.println(typeHeaderLine)
      }
    } catch (ex : Exception) {
      throw new FileOutboundFailedException("Writing ${type} record type footer line to file failed.", ex)
    }
  }

  protected function writeRecords(processingFileName : String, writer : PrintWriter) {
    var setOfAccounts = new HashSet<String>()
    // Write item lines to file, set outbound record to Processing status
    for (type in _fileTransformer.OutboundRecordTypeList) {
      var outboundResults = findOutboundRecordsToProcess(type)
      var typeAccounts = new HashSet<String>()
      if (!outboundResults.Empty) {
        writingTypeRecords(processingFileName, outboundResults, type, writer, typeAccounts)
        setOfAccounts.addAll(typeAccounts)
      }
    }
    _stats.NumOfUniqueAccounts = setOfAccounts.Count
  }

  protected function writingTypeRecords(
      processingFileName : String,
      outboundResults : IQueryBeanResult<OutBoundRecord_ACC>,
      type : OutBoundRecordType_ACC,
      writer : PrintWriter,
      typeAccounts : HashSet) {
    var numOfTypeRecordsProcessed = 0
    if (_fileTransformer.BuildRecordTypeHeaderLine) {
      writingTypeHeader(writer, type)
    }
    var total = outboundResults.Count
    try {
      for (outboundRecord in outboundResults index i) {
        if ((i + 1) % 100 == 0) {
          _log.info("writingTypeRecords ${type.Code}: ${i + 1} of ${total}")
        }
        var output : String
        var errored = false
        try {
          output = _fileTransformer.buildItemLineForFile(outboundRecord.DataOutput, outboundRecord.LetterID)
        } catch (ex : Exception) {
          errored = true
          // Edge case scenario. When we fail here it would be the outbound message, that failed.
          _log.error_ACC("Unexpected error occured processing an outbound record: " + outboundRecord.getPublicID(), ex)
          Transaction.runWithNewBundle(\newBundle -> {
            outboundRecord = newBundle.add(outboundRecord)
            outboundRecord.setAsProcessingError(ex)
            ErrorHandlingHelper.createRecordFailedActivity(newBundle, _outboundHeader, outboundRecord, ex)
          })
          _stats.incrementNumOfRecordsErrored()
        }
        if (!errored) {
          writer.println(output)
          Transaction.runWithNewBundle(\newBundle -> {
            outboundRecord = newBundle.add(outboundRecord)
            outboundRecord.setAsProcessed(_outboundHeader)
          })
          numOfTypeRecordsProcessed++
          _stats.addToHashTotal(outboundRecord.HashTotal)
          _stats.addToTotalAmount(outboundRecord.Amount)
          _stats.incrementNumOfRecordsProcessed()
          //count distinct account across the file
          typeAccounts.add(outboundRecord.AccountNumber)

          afterOutboundRecordProcessed(outboundRecord)
        }
      }
    } catch (writingRecordsEx : Exception) {
      throw new FileOutboundFailedException("Writing records to file failed.", writingRecordsEx)
    }
    if (_fileTransformer.BuildRecordTypeFooterLine) {
      writingTypeFooter(writer, type, numOfTypeRecordsProcessed)
    }

    _log.info("writingTypeRecords ${type.Code} completed. Total=${total}")
  }

  protected function writingTrailer(writer : PrintWriter) : void {
    try {
      final var trailerLine = _fileTransformer.buildTrailerLineForFile(_stats)
      if (trailerLine != null) {
        writer.println(trailerLine)
      }
    } catch (trailerEx : Exception) {
      throw new FileOutboundFailedException("Writing trailerline to file failed.", trailerEx)
    }
  }

  protected function closeFile(writer : PrintWriter, fos : OutputStream) : void {
    if (writer != null) {
      try {
        writer.close()
      } catch (e : IOException) {
        _log.error_ACC("Unexpected IO error occured closing the outbound processing file ", e)
      }
    }
    if (fos != null) {
      try {
        fos.close()
      } catch (e : IOException) {
        _log.error_ACC("Unexpected IO error occured closing the outbound processing file ", e)
      }
    }
  }

  protected function createInitialHeader() {
    try {
      gw.transaction.Transaction.runWithNewBundle(\newBundle -> {
        _outboundHeader = new OutBoundHeader_ACC(newBundle)
        _outboundHeader.initialState(getType())
      })
    } catch (e : Exception) {
      var ex = new FileOutboundFailedException("Header creation failed.", e)
      throw ex
    }
  }

  protected function findOutboundRecordsToConvert() : IQueryBeanResult<OutBoundRecord_ACC> {
    var queryObj = Query.make(entity.OutBoundRecord_ACC)
    queryObj.or(\orCriteria -> {
      for (type in _fileTransformer.OutboundRecordTypeList) {
        orCriteria.compare(entity.OutBoundRecord_ACC#Type, Relop.Equals, type)
      }
    })
    var orderBy = QuerySelectColumns.path(Paths.make(entity.OutBoundRecord_ACC#CreateTime))
    queryObj.compareIn(entity.OutBoundRecord_ACC#Status, {OutBoundRecordStatus_ACC.TC_NEW, OutBoundRecordStatus_ACC.TC_RETRY})
    return queryObj
        .withLogSQL(true)
        .select()
        .orderBy(orderBy) as IQueryBeanResult<OutBoundRecord_ACC>
  }

  /**
   * Find records that are in either TC_CONVERTED status or records in TC_PROCESSED status but it's got a header status in TC_PROCESSING / TC_ERROR status,
   * which means that record failed in a previous run.
   *
   * @param outboundType
   * @return
   */
  protected function findOutboundRecordsToProcess(type : OutBoundRecordType_ACC) : IQueryBeanResult<OutBoundRecord_ACC> {
    final var queryObj = Query.make(entity.OutBoundRecord_ACC)
    queryObj.compare(entity.OutBoundRecord_ACC#Type, Relop.Equals, type)
    var orderBy = QuerySelectColumns.path(Paths.make(entity.OutBoundRecord_ACC#CreateTime))
    var resultObj : IQueryBeanResult<OutBoundRecord_ACC>
    //pick up converted outbound records
    queryObj.compare(entity.OutBoundRecord_ACC#Status, Relop.Equals, OutBoundRecordStatus_ACC.TC_CONVERTED)
    //pick up processed outboundRecords with unsuccessful header
    var queryFailedProcessedOutboundRecord = Query.make(entity.OutBoundRecord_ACC)
    var queryHeader = queryFailedProcessedOutboundRecord.join(entity.OutBoundRecord_ACC#Header)
    queryHeader.or(\orCriteria -> {
      orCriteria.compare(entity.OutBoundHeader_ACC#Status, Relop.Equals, OutBoundHeaderStatus_ACC.TC_PROCESSING)
      orCriteria.compare(entity.OutBoundHeader_ACC#Status, Relop.Equals, OutBoundHeaderStatus_ACC.TC_ERRORED)
    })
    queryFailedProcessedOutboundRecord.compare(entity.OutBoundRecord_ACC#Type, Relop.Equals, type)
    queryFailedProcessedOutboundRecord.compare(entity.OutBoundRecord_ACC#Status, Relop.Equals, OutBoundRecordStatus_ACC.TC_PROCESSED)
    //Unio above 2 sets
    resultObj = queryObj.union(queryFailedProcessedOutboundRecord).select().orderBy(orderBy) as IQueryBeanResult<OutBoundRecord_ACC>

    return resultObj
  }

  protected function createAProcessingFilePath(processingFilename : String) : Path {
    var doneFilePath = FileSystems.getDefault().getPath(_fileTransformer.FOLDER_OUTGOING_DONE_DEFAULT, {processingFilename})
    if (doneFilePath.toFile().exists()) {
      throw new FileExistsException("File already exists in 'done' folder: ${processingFilename}")
    }
    var processingFilePath = FileSystems.getDefault().getPath(getProcessingFolderPath(), {processingFilename})
    Files.createDirectories(processingFilePath.getParent(), {})
    return processingFilePath
  }


  private function createReport() {
    var REPORTS = {
        "OutboundDirectDebitPaymentsFile_ACC" -> "DirectDebitReport.gosu.rtf",
        "OutboundDirectCreditPaymentsFile_ACC" -> "DirectCreditReport.gosu.rtf"
    }
    var reportTemplate = REPORTS.get(this._outboundHeader.BatchType)
    if (reportTemplate != null) {
      var reportAPI = new OutboundReportAPI()
      reportAPI.createReport(this._outboundHeader, reportTemplate, _fileTransformer.FOLDER_OUTGOING_DONE_DEFAULT)
    }

  }

  function getProcessingFolderPath() : String {
    return _fileTransformer.FOLDER_OUTGOING_PROCESSING_DEFAULT
  }

  function getDoneFolderPath() : Path {
    return FileSystems.getDefault().getPath(_fileTransformer.FOLDER_OUTGOING_DONE_DEFAULT, {})
  }

  function getErrorFolderPath() : Path {
    return FileSystems.getDefault().getPath(_fileTransformer.FOLDER_OUTGOING_ERROR_DEFAULT, {})
  }

  protected function moveFile(sourceFile : Path, destinationFolder : Path) : Path {
    var destPath = FileSystems.getDefault().getPath(destinationFolder.toString(), {sourceFile.getFileName().toString()})
    Files.createDirectories(destPath.getParent(), {})
    return Files.move(sourceFile, destPath, {StandardCopyOption.ATOMIC_MOVE})
  }

  protected function beforeOutboundFileProcessed() {
    // implemented by subclass
  }

  protected function afterOutboundRecordProcessed(outboundRecord : OutBoundRecord_ACC) {
    // implemented by subclass
  }

  protected function afterOutboundFileProcessed(processingFileName : String) {
    // implemented by subclass
  }

}
