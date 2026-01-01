package nz.co.acc.plm.integration.instruction

uses nz.co.acc.plm.integration.instruction.builder.WorkerBuilder
uses nz.co.acc.plm.integration.instruction.handler.WorkHandler
uses nz.co.acc.plm.integration.instruction.ui.InstructionListUIHelper

/**
 * The functions create to simply logic for
 * InstructionType_ACC
 */
enhancement InstructionTypeEnhancement : InstructionType_ACC {

  /**
   * Create WorkerBuilder by the current Typekey
   *
   * @return WorkBuilder
   */
  public function createWorkerBuilder() : WorkerBuilder {
    var theClass = Class.forName(
        "nz.co.acc.plm.integration.instruction.builder.${this.Code}WorkerBuilder")
    var builder = theClass.newInstance() as WorkerBuilder
    return builder
  }

  /**
   * Create WorkHandler by the current Typekey
   *
   * @return WorkHandler
   */
  public function createWorkHandler() : WorkHandler {
    var theClass = Class.forName(
        "nz.co.acc.plm.integration.instruction.handler.${this.Code}WorkHandler")
    var handler = theClass.getDeclaredConstructor().newInstance() as WorkHandler
    return handler
  }


  /**
   * The reason code based on InstructionType
   *
   * @return ReasonCode
   */
  public function deriveReasonCode() : ReasonCode {
    var theReasonCode = ReasonCode.get("${this.Code}_ACC")
    return theReasonCode
  }

}
