package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.AddressEndDateInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
class AddressEndDateInstructionRecordMapper implements InstructionRecordMapper<AddressEndDateInstructionRecord> {

  override public function fromCSV(parser : CSVParser) : AddressEndDateInstructionRecord {
    var accID = parser.nextString()
    var addressPublicID = parser.nextString()

    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(addressPublicID)) {
      throw new InvalidFieldException("AddressPublicID is blank")
    }

    return new AddressEndDateInstructionRecord(accID, addressPublicID)
  }

  override public function fromEntity(instructionRecord : InstructionRecord_ACC) : AddressEndDateInstructionRecord {
    var accID = instructionRecord.ACCID
    var addressPublicID = instructionRecord.Parameters
    if (addressPublicID == null) {
      throw new DisplayableException("Parameters[${instructionRecord.Parameters}] is not valid!")
    }
    return new AddressEndDateInstructionRecord(
        accID,
        addressPublicID)
  }

  override public function buildParameterCSV(record : AddressEndDateInstructionRecord) : String {
    return record.AddressPublicID
  }

}