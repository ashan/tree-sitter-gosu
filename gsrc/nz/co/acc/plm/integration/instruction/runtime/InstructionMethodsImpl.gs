package nz.co.acc.plm.integration.instruction.runtime

uses nz.co.acc.plm.integration.instruction.builder.WorkerBuilder

/**
 * Instruction runtime methods to load WorkBuilder...
 */
class InstructionMethodsImpl implements InstructionMethods {

  private var _instruction: Instruction_ACC
  private var _builder: WorkerBuilder

  /**
   * Constructor...
   */
  construct(instruction: Instruction_ACC) {
    _instruction = instruction
    _builder = _instruction.InstructionType_ACC.createWorkerBuilder()
    _builder.Instruction = _instruction
  }

  /**
   * Getter for WorkBuilder
   *
   * @return WorkerBuilder
   */
  override property get WorkerBuilder(): WorkerBuilder {
    return _builder
  }

  /**
   * Setter for WorkBuilder
   *
   * @param WorkerBuilder
   */
  override property set WorkerBuilder(builder: WorkerBuilder) {
    _builder = builder
    _builder.Instruction = _instruction
  }

  /**
   * Invoke builder to build workers.
   * This can be run Asynchronously in workflow or
   * Synchronously in the same bundle...
   */
  public function buildWorker() {
    if (_instruction.IsSynchronous) {
      _builder.loadParameters()
      _builder.buildWorker(_instruction.Bundle)
    } else {
      var wf = new InstructionWF_ACC(_instruction.Bundle)
      wf.Instruction_ACC = _instruction
      wf.startAsynchronously()
    }
  }
}