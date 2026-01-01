package nz.co.acc.common.integration.bulkupload.csvprocessor

uses edge.util.either.Either
uses gw.pl.util.csv.CSVParser
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvrowparser.IRowParser
uses nz.co.acc.common.integration.bulkupload.error.RowValidationError

uses java.io.File
uses java.io.FileReader

/**
 * Created by OurednM on 25/06/2018.
 */
abstract class AbstractCSVProcessor<RowType> {
  private var _rowParser : IRowParser
  private var _updater : BulkUploadProcessUpdater
  private var _uploadFile : File
  private var _isProcessed : Boolean
  protected static var _log: StructuredLogger_ACC
  private var _ftpUploaded : Boolean

  construct(rowParser : IRowParser<RowType>, updater : BulkUploadProcessUpdater, uploadFile : File) {
    this._rowParser = rowParser
    this._updater = updater
    this._uploadFile = uploadFile
    this._isProcessed = false
  }

  construct() {
    // NTK-7937 added for GUnit testing of extended class
  }

  protected function onSuccess() {
    _updater.updateProgressCounters(true)
  }

  protected function onFailure() {
    _updater.updateProgressCounters(false)
  }

  protected function getNumSuccesses(): Integer {
    return _updater.NumSuccesses
  }

  abstract function processRows(parsedRows : List<RowType>) : CSVProcessorResult

  /**
   * Either returns a list of errors or the number of successfully processed rows
   *
   * @param csvParser
   * @return
   */
  function parseRows(csvParser : CSVParser) : Either<List<RowValidationError>, LinkedList<RowType>> {
    _log.info("Importing CSV file. Parsing rows...")

    var errors = new LinkedList<RowValidationError>()
    var parsedRows = new LinkedList<RowType>()
    var rowNumber = 0

    try {
      // skip header row
      rowNumber = 1
      csvParser.nextLine()

      while (csvParser.nextLine()) {
        rowNumber++
        _log.info("Parsing row ${rowNumber}")
        var nextResult = _rowParser.parseRow(csvParser)
        if (nextResult.isLeft) {
          _log.info("Row ${rowNumber} is invalid")
          errors.add(new RowValidationError(rowNumber, nextResult.left))
        } else {
          _log.info("Row ${rowNumber} is valid")
          parsedRows.add(nextResult.right as RowType)
        }
      }
    } catch (e : Exception) {
      _log.error_ACC("Failed to parse CSV", e)
      errors.add(new RowValidationError(rowNumber, "Failed to parse CSV: ${e.Message}"))
    }

    _updater.updateRowCount(errors.Count + parsedRows.Count)

    if (errors.HasElements) {
      _log.info("${errors.Count} errors found when parsing CSV file.")
      return Either.left(errors)
    } else {
      _log.info("No errors found when parsing CSV file.")
      return Either.right(parsedRows)
    }
  }

  function processCSV() {
    var result : CSVProcessorResult
    var fileReader : FileReader
    if (_isProcessed) {
      _log.info("File already processed. Exiting.")
      return
    }

    try {
      fileReader = new FileReader(_uploadFile)
      var csvParser = createCSVParser(fileReader)

      if (csvParser == null) {
        result = new CSVProcessorResult({new RowValidationError(1, "")})

      } else {
        var parseResult = parseRows(csvParser)
        if (parseResult.isLeft) {
          result = new CSVProcessorResult(parseResult.left)
        } else {
          result = processRows(parseResult.right)
        }
      }

      _updater.finish(result)

    } catch (e : Exception) {
      _log.error_ACC("Process failed", e)
    } finally {
      fileReader.close()
      if(!_ftpUploaded) {
        _uploadFile.delete()
      }
    }

    _isProcessed = true
  }

  property set IsFTPUploaded(ftpUploaded:Boolean) {
    _ftpUploaded = ftpUploaded
  }

  private function createCSVParser(fileReader : FileReader) : CSVParser {
    try {
      _log.info("Creating CSVParser")
      return new CSVParser(fileReader)
    } catch (e : Exception) {
      _log.error_ACC("Failed to open File ${_uploadFile.getCanonicalPath()}", e)
      return null
    }
  }

}