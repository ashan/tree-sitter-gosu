package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.PrimaryContactInstructionRecord
uses nz.co.acc.integration.instruction.record.impl.ValidForClaimsInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException

class ValidForClaimsInstructionRecordMapper implements InstructionRecordMapper<ValidForClaimsInstructionRecord> {

  override function fromCSV(parser : CSVParser) : ValidForClaimsInstructionRecord {
    var accID = parser.nextString().trim()
    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }

    return new ValidForClaimsInstructionRecord(accID)
  }

  override function fromEntity(instructionRecord : InstructionRecord_ACC) : ValidForClaimsInstructionRecord {
    var accID = instructionRecord.ACCID
    return new ValidForClaimsInstructionRecord(accID)
  }

  override function buildParameterCSV(record : ValidForClaimsInstructionRecord) : String {
    return ""
  }

}