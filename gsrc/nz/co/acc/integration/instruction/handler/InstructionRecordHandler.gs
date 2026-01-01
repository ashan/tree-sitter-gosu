package nz.co.acc.integration.instruction.handler

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.integration.instruction.record.InstructionRecord

/**
 * Created by Mike Ourednik on 5/02/2021.
 */
abstract class InstructionRecordHandler<T extends InstructionRecord> {

  private final var _instructionRecord: T as readonly InstructionRecord

  public construct(instructionRecord: T)  {
    _instructionRecord = instructionRecord
  }

  abstract public function processInstructionRecord(bundle : Bundle)

}