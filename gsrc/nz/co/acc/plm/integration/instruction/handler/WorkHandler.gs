package nz.co.acc.plm.integration.instruction.handler

uses gw.pl.persistence.core.Bundle

/**
 * All the instruction work handler should implement this interface...
 */
interface WorkHandler {

  /**
   * The handler logic
   * @param bundle
   */
  public function doWork(bundle : Bundle)

  /**
   * Interpret the saved parameters
   */
  public function loadParameters()

  /**
   * Getter for Related Instruction Worker
   * @return InstructionWorker
   */
  public property get InstructionWorker() : InstructionWorker_ACC

  /**
   * Setter for Related Instruction Worker
   * @param  InstructionWorker
   */
  public property set InstructionWorker(executor : InstructionWorker_ACC)

  /**
   * Is the context valid for doWork function
   * @param  InstructionWorker
   */
  public function isValidContext() : boolean
}