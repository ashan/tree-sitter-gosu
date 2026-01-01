package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.PrimaryContactInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException

class PrimaryContactInstructionRecordMapper implements InstructionRecordMapper<PrimaryContactInstructionRecord> {

  override function fromCSV(parser : CSVParser) : PrimaryContactInstructionRecord {
    var accID = parser.nextString().trim()
    var primaryContactPublicId = parser.nextString().trim()

    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(primaryContactPublicId)) {
      throw new InvalidFieldException("primaryContactPublicId is blank")
    }

    return new PrimaryContactInstructionRecord(accID, primaryContactPublicId)
  }

  override function fromEntity(instructionRecord : InstructionRecord_ACC) : PrimaryContactInstructionRecord {
    var accID = instructionRecord.ACCID
    var primaryContactPublicId = instructionRecord.Parameters
    if(GosuStringUtil.isBlank(primaryContactPublicId)){
      throw new DisplayableException("Parameters[${instructionRecord.Parameters}] is not valid!")
    }
    return new PrimaryContactInstructionRecord(accID, primaryContactPublicId)
  }

  override function buildParameterCSV(record : PrimaryContactInstructionRecord) : String {
    return record.PrimaryContactPublicId
  }


}