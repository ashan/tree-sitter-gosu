package nz.co.acc.integration.instruction.handler.impl

uses gw.api.database.Query
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.record.impl.ManualRetryInstructionRecord
uses nz.co.acc.integration.ir.workqueue.IRInboundRecordProcessor

class ManualRetryInstructionRecordHandler extends InstructionRecordHandler<ManualRetryInstructionRecord> {

  construct(instructionRecord : ManualRetryInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    var key = Query.make(IRProcessorKey_ACC).compare(IRProcessorKey_ACC#ACCID, Equals, this.InstructionRecord.ACCID).select().AtMostOneRow
    new IRInboundRecordProcessor().processWorkItem(key)
  }

}