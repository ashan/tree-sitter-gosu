package nz.co.acc.plm.integration.instruction.runtime

uses nz.co.acc.plm.integration.instruction.handler.WorkHandler

/**
 * Instruction runtime methods to load WorkHandler...
 */
structure InstructionWorkerMethods {
  /**
   * Getter for WorkHandler
   * @return WorkHandler
   */
  public property get WorkHandler() : WorkHandler

  /**
   * Setter for WorkHandler
   * @param handler
   */
  public property set WorkHandler(handler : WorkHandler)

}