package nz.co.acc.plm.integration.instruction.runtime

uses nz.co.acc.plm.integration.instruction.handler.WorkHandler

/**
 * Instruction runtime methods to load WorkHandler...
 */
class InstructionWorkerMethodsImpl implements InstructionWorkerMethods {

  private var _worker : InstructionWorker_ACC
  private var _workHandler : WorkHandler

  /**
   * Constructor
   * @param worker
   */
  construct (worker : InstructionWorker_ACC) {
    _worker = worker
    _workHandler = _worker.Instruction_ACC.InstructionType_ACC.createWorkHandler()
    _workHandler.InstructionWorker = _worker
  }

  /**
   * Getter for WorkHandler
   * @return WorkHandler
   */
  override property get WorkHandler() : WorkHandler {
    return _workHandler
  }

  /**
   * Setter for WorkHandler
   * @param handler
   */
  override property set WorkHandler(handler : WorkHandler) {
    _workHandler = handler
  }
}