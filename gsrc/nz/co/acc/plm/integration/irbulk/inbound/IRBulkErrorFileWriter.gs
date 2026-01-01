package nz.co.acc.plm.integration.irbulk.inbound

uses gw.surepath.suite.integration.logging.StructuredLogger

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.nio.file.Files
uses java.nio.file.Path
uses java.nio.file.Paths
uses java.nio.file.StandardOpenOption

/**
 * Helper class for logging input errors during IRD bulk file processing.
 * <p>
 * Created by OurednM on 31/01/2018.
 */
class IRBulkErrorFileWriter {

  var filePath: Optional<Path>as readonly FilePath = Optional.empty()
  var lines = new LinkedList<String>()

  var _errorType: String
  var _processingFileName: String
  var _errorFolder: String

  /**
   *
   * @param errorType A string naming a category of errors. Used when generating the output filename
   * @param processingFileName The path of the inbound processing file. Used when generating the output filename
   * @param errorFolder Output directory of destination file
   */
  construct(errorType: String, processingFileName: String, errorFolder: String) {
    this._errorType = errorType
    this._processingFileName = processingFileName
    this._errorFolder = errorFolder
  }

  function add(line: String) {
    lines.add(line)
  }

  /**
   * Writes content to a file in the error directory. If file exists it will be overwritten.
   */
  function flush() {
    if (lines.HasElements) {
      var destination = makeFilePath()
      this.filePath = Optional.of(destination)
      StructuredLogger.INTEGRATION.info( this + " " + "flush" + " " + "Writing ${lines.Count} lines to file ${filePath}")
      Files.write(destination, lines, {StandardOpenOption.WRITE, StandardOpenOption.CREATE_NEW})
    }
  }

  /**
   * Number of lines currently stored in the buffer.
   * @return
   */
  function lineCount(): Integer {
    return lines.Count
  }

  private function makeFilePath(): Path {
    var millis = java.util.Date.Now.toInstant().toEpochMilli()
    var fileName = "${millis}.${this._errorType}.${this._processingFileName}"
    return Paths.get(this._errorFolder, {fileName})
  }
}