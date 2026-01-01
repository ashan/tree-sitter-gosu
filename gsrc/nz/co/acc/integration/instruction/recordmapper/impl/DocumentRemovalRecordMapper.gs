package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.DocumentRemovalInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException

class DocumentRemovalRecordMapper implements InstructionRecordMapper<DocumentRemovalInstructionRecord> {

  override function fromCSV(parser : CSVParser) : DocumentRemovalInstructionRecord {
    var accID = parser.nextString().trim()
    var documentPublicID = parser.nextString().trim()


    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(documentPublicID)) {
      throw new InvalidFieldException("DocumentPublicID is blank")
    }

    return new DocumentRemovalInstructionRecord(accID, documentPublicID)
  }

  override function fromEntity(instructionRecord : InstructionRecord_ACC) : DocumentRemovalInstructionRecord {
    var accID = instructionRecord.ACCID
    var documentPublicID = instructionRecord.Parameters

    if (GosuStringUtil.isBlank(documentPublicID)) {
      throw new DisplayableException("Parameters[${instructionRecord.Parameters}] is not valid!")
    }

    return new DocumentRemovalInstructionRecord(accID, documentPublicID)
  }

  override function buildParameterCSV(record : DocumentRemovalInstructionRecord) : String {
    return record.DocumentPublicID
  }
}