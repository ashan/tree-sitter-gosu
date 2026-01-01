package nz.co.acc.integration.instruction.recordmapper

uses gw.api.system.database.SequenceUtil
uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.integration.instruction.record.InstructionRecord
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
interface InstructionRecordMapper<T extends InstructionRecord> {
  public function fromCSV(parser : CSVParser) : T

  public function fromEntity(instructionRecord : InstructionRecord_ACC) : T

  public function buildParameterCSV(record : T) : String

  public function createEntity(
      bundle : Bundle,
      record : T,
      instructionFile : Optional<InstructionFile_ACC>) : InstructionRecord_ACC {
    var instructionRecord = new InstructionRecord_ACC(bundle)
    instructionRecord.setACCID(record.ACCID)
    instructionRecord.setParameters(buildParameterCSV(record))
    instructionRecord.setInstructionType_ACC(record.InstructionType)
    instructionRecord.setStatus(InstructionRecordStatus_ACC.TC_UNPROCESSED)
    instructionRecord.setRecordSequence(SequenceUtil.next(1, ConstantPropertyHelper.SEQUENCE_INBOUND))
    instructionRecord.setSource(record.InstructionSource)
    if (instructionFile.Present) {
      instructionRecord.setInstructionFile_ACC(instructionFile.get())
    }
    return instructionRecord
  }
}