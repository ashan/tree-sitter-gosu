package nz.co.acc.plm.integration.instruction.builder

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser

uses java.io.File
uses java.io.FileInputStream
uses java.io.InputStream

/**
 * All the worker builder should extends this base class...
 */
abstract class WorkerBuilderBase implements WorkerBuilder {

  private var _instruction : Instruction_ACC

  /**
   * Default implementation for Instruction Getter
   * @return
   */
  override public property get Instruction() : Instruction_ACC {
    return _instruction
  }

  /**
   * Default implementation for Instruction Setter
   * @param instruction
   */
  override public property set Instruction(instruction : Instruction_ACC) {
    this._instruction = instruction
  }

  /**
   * Default implementation for "loadParameters"
   */
  override public function loadParameters() {}

  /**
   * Import instruction from CSV
   *
   * @param aFile a CSV file
   */
  override function importFromCSV(aFile: WebFile, bundle : Bundle) {
    if (aFile == null) {
      throw new DisplayableException("Please specify a File!")
    }
    importFromCSV(aFile.InputStream, bundle)
  }

  /**
   * Import instruction from CSV
   *
   * @param aFile a CSV file
   */
  override function importFromCSV(aFile: File, bundle : Bundle) {
    if (aFile == null) {
      throw new DisplayableException("Please specify a File!")
    }
    var input = new FileInputStream(aFile)
    importFromCSV(input, bundle)
    input.close()
  }

  /**
   * Import csv from InputStream
   *
   * @param aFile a CSV file
   */
  public function importFromCSV(inputStream: InputStream, bundle : Bundle) {
    if (inputStream == null) {
      throw new DisplayableException("Please specify an Input")
    }
    var parser = new CSVParser(inputStream)
    processHeading(parser, bundle)

    var errMsg: String
    // We've read the first line already, hence start with 2.
    var i = 2
    while (parser.nextLine()) {
      try {
        buildUnprocessedWorker(parser, bundle)
      } catch (e: Exception) {
        errMsg = "Line ${i} : ${e.Message}"
        throw new DisplayableException(errMsg, e)
      }
      i++
    }
  }

  /**
   * Process Heading if required
   * @param parser CSVParser
   * @param b Bundle
   */
  protected function processHeading(parser : CSVParser, b : Bundle) {
    parser.nextLine()
  }

  /**
   * Build unprocessed workers, can be extended.
   * @param parser CSVParser
   * @param b Bundle
   * @return InstructionWorker_ACC
   */
  protected function buildUnprocessedWorker(parser : CSVParser, b : Bundle) : InstructionWorker_ACC {
    return null
  }

  /**
   * Find unprocessed workers for this instruction
   * @return IQueryBeanResult<InstructionWorker_ACC>
   */
  protected function findUprocessedWorkers() : IQueryBeanResult<InstructionWorker_ACC> {
    var query = Query.make(InstructionWorker_ACC)
    query.compare(InstructionWorker_ACC#Instruction_ACC, Equals, Instruction)
    query.compare(InstructionWorker_ACC#InstructionExecStatus_ACC, Equals, InstructionExecStatus_ACC.TC_UNPROCESSED)
    return query.select()
  }
}