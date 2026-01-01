package nz.co.acc.integration.instruction.loader

uses com.google.common.base.Stopwatch
uses com.google.common.collect.Lists
uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser

uses nz.co.acc.integration.instruction.record.InstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapperFactory
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.io.File
uses java.io.FileInputStream
uses java.io.InputStream
uses java.util.concurrent.TimeUnit

/**
 * Created by Mike Ourednik on 5/02/2021.
 */
class InstructionFileLoader {
  var DB_INSERT_BATCH_SIZE = ScriptParameters.InstructionFileLoaderBatchSize_ACC
  static final var _log = StructuredLogger.INTEGRATION.withClass(InstructionFileLoader)
  var _instructionType : InstructionType_ACC
  var _instructionFile : File
  var _instructionFileName : String
  var _uploadUser : User // only used for uploads via UI

  public function withBatchSize(batchSize : Integer) : InstructionFileLoader {
    DB_INSERT_BATCH_SIZE = batchSize
    return this
  }

  construct(instructionFile : File, instructionType : InstructionType_ACC) {
    _instructionFile = instructionFile
    _instructionType = instructionType
    _instructionFileName = instructionFile.Name
    _uploadUser = null
  }

  // Called from UI only
  construct(instructionFile : File, fileName : String, instructionType : InstructionType_ACC, uploadUser : User) {
    _instructionFile = instructionFile
    _instructionType = instructionType
    _instructionFileName = fileName
    _uploadUser = uploadUser
  }

  function importFromCSV() : InstructionFile_ACC {
    if (_instructionFile == null) {
      throw new DisplayableException("Please specify a File!")
    } else {
      return importFromCSV(_instructionFile, _instructionType)
    }
  }

  private function importFromCSV(file : File, instructionType : InstructionType_ACC) : InstructionFile_ACC {
    _log.info("Loading file ${_instructionFileName} from ${file.Path}")
    if (file == null) {
      throw new DisplayableException("Please specify a File!")
    }
    var header = createInstructionFileHeader(instructionType, _instructionFileName)
    using(var input = new FileInputStream(file)) {
      return importFromCSV(input, header)
    }
  }

  private function importFromCSV(inputStream : InputStream, header : InstructionFile_ACC) : InstructionFile_ACC {
    try {
      var recordCount = importBatchesFromStream(inputStream, header)
      updateStatusSuccess(header, recordCount)
    } catch (e : Exception) {
      updateStatusError(header, e)
    }
    header.refresh()
    return header
  }

  /**
   * Import csv from InputStream
   *
   * @param aFile a CSV file
   */
  private function importBatchesFromStream(inputStream : InputStream, header : InstructionFile_ACC) : Integer {
    var recordMapper = new InstructionRecordMapperFactory().getInstructionRecordMapper(header.InstructionType_ACC)
    var instructionRecords = parseRecords(inputStream, recordMapper)

    var instructionRecordBatches = Lists.partition(instructionRecords, DB_INSERT_BATCH_SIZE)
    var optionalHeader = Optional.of(header)
    var processed = 0

    var stopwatch = Stopwatch.createStarted()

    for (batch in instructionRecordBatches index i) {
      processed += batch.Count
      _log.info("Inserting batch ${i + 1} of ${instructionRecordBatches.Count} (${processed} of ${instructionRecords.Count} records)")
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        for (record in batch) {
          recordMapper.createEntity(bundle, record, optionalHeader)
        }
      })
    }

    var elapsed = stopwatch.elapsed(TimeUnit.MILLISECONDS) as double
    if (elapsed > 0) {
      var total = instructionRecords.Count as double
      var rate = total / (elapsed / 1000)
      var rateString = String.format("%.1f per second", {rate})
      _log.info("Inserted ${total} records in ${elapsed} ms. ${rateString}")
    }

    return instructionRecords.Count
  }

  private function parseRecords(inputStream : InputStream, recordMapper : InstructionRecordMapper) : ArrayList<InstructionRecord> {
    _log.info("Parsing records from stream")
    if (inputStream == null) {
      throw new DisplayableException("Please specify an Input")
    }

    var instructionRecords = new ArrayList<InstructionRecord>(10000)
    var parser = new CSVParser(inputStream)
    processHeading(parser)

    // We have read the first line already, hence start after row 1
    var lineNumber = 1
    while (parser.nextLine()) {
      lineNumber++
      try {
        instructionRecords.add(recordMapper.fromCSV(parser))
      } catch (e : Exception) {
        _log.error_ACC("Failed to process line ${lineNumber}", e)
        var errMsg = "Line ${lineNumber} : ${e.StackTraceAsString.truncate(512)}"
        throw new DisplayableException(errMsg, e)
      }
    }
    _log.info("Parsed ${instructionRecords.Count} records")
    return instructionRecords
  }

  /**
   * Process Heading if required
   *
   * @param parser CSVParser
   * @param b      Bundle
   */
  protected function processHeading(parser : CSVParser) {
    parser.nextLine()
  }

  private function createInstructionFileHeader(
      type : InstructionType_ACC,
      filename : String) : InstructionFile_ACC {

    var instructionFile : InstructionFile_ACC
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      instructionFile = new InstructionFile_ACC(bundle)
      instructionFile.setInstructionType_ACC(type)
      instructionFile.setFilename(filename)
      instructionFile.setUploadUserID(_uploadUser)
    })
    return instructionFile
  }

  private function updateStatusError(header : InstructionFile_ACC, e : Exception) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      header = bundle.add(header)
      header.setErrorMessage(e.Message)
      header.setStatus(InstructionFileStatus_ACC.TC_FAILED)
    })
  }

  private function updateStatusSuccess(header : InstructionFile_ACC, recordCount : Integer) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      header = bundle.add(header)
      header.setStatus(InstructionFileStatus_ACC.TC_LOADED)
      header.setRecordCount(recordCount)
    })
  }

}