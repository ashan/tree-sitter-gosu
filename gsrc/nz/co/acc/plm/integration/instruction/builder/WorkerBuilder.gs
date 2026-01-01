package nz.co.acc.plm.integration.instruction.builder

uses gw.api.web.WebFile
uses gw.pl.persistence.core.Bundle

uses java.io.File

/**
 * All the instruction worker builder should implement this interface...
 */
interface WorkerBuilder {

  /**
   * Main function. To build the individual InstructionWorker_ACC
   * Can be run via workflow or in the same bundle
   * @param bundle
   */
  public function buildWorker(bundle : Bundle)

  /**
   * Interpret the saved parameters
   */
  public function loadParameters()

  /**
   * Getter for Instruction_ACC
   */
  public property get Instruction() : Instruction_ACC

  /**
   * Getter for Instruction_ACC
   * @param instruction
   */
  public property set Instruction(instruction : Instruction_ACC)

  /**
   * Import instruction from CSV
   *
   * @param aFile a CSV file
   */
  public function importFromCSV(aFile: WebFile, bundle : Bundle)

  /**
   * Import instruction from CSV
   *
   * @param aFile a CSV file
   */
  public function importFromCSV(aFile: File, bundle : Bundle)
}