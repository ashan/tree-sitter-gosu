package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.pl.persistence.core.Bundle
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.integration.instruction.record.impl.ManualRetryInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper

class ManualRetryInstructionRecordMapper implements InstructionRecordMapper<ManualRetryInstructionRecord> {

  override function fromCSV(parser : CSVParser) : ManualRetryInstructionRecord {
    return null
  }

  override function fromEntity(instructionRecord : InstructionRecord_ACC) : ManualRetryInstructionRecord {
    var accID = instructionRecord.ACCID
    return new ManualRetryInstructionRecord(accID)
  }

  override function buildParameterCSV(record : ManualRetryInstructionRecord) : String {
    return null
  }

}