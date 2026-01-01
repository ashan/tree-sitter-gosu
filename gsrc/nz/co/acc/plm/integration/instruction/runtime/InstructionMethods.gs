package nz.co.acc.plm.integration.instruction.runtime

uses nz.co.acc.plm.integration.instruction.builder.WorkerBuilder

/**
 * Instruction runtime methods to load WorkBuilder...
 */
structure InstructionMethods {

  /**
   * Getter for WorkerBuilder
   * @return
   */
  public property get WorkerBuilder() : WorkerBuilder

  /**
   * Setter for WorkBuilder
   * @param builder
   */
  public property set WorkerBuilder(builder : WorkerBuilder)

  /**
   * Invoke WorkerBuilder to build worker
   */
  public function buildWorker()

}