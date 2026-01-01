package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.AddressFlagsInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
class AddressFlagsInstructionRecordMapper implements InstructionRecordMapper<AddressFlagsInstructionRecord> {

  override public function fromCSV(parser : CSVParser) : AddressFlagsInstructionRecord {
    var accID = parser.nextString()
    var contactPublicID = parser.nextString()
    var primaryAddressPublicID = parser.nextString()
    var cpcpxAddressPublicID = parser.nextString()
    var wpcAddressPublicID = parser.nextString()
    var wpsAddressPublicID = parser.nextString()

    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(primaryAddressPublicID)) {
      throw new InvalidFieldException("PrimaryAddressPublicID is blank")
    }

    return new AddressFlagsInstructionRecord(
        accID,
        contactPublicID,
        primaryAddressPublicID,
        cpcpxAddressPublicID,
        wpcAddressPublicID,
        wpsAddressPublicID)
  }

  override public function fromEntity(instructionRecord : InstructionRecord_ACC) : AddressFlagsInstructionRecord {
    var accID = instructionRecord.ACCID
    var parameters = instructionRecord.Parameters

    var values : String[]
    if (parameters != null) {
      values = parameters.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length < 4 || values.length > 5) {
      throw new DisplayableException("Parameters[${parameters}] is not valid!")
    }

    var contactPublicID = values[0]
    var primaryAddressPublicID = values[1]
    var cpcpxAddressPublicID = values[2]
    var wpcAddressPublicID = values[3]
    var wpsAddressPublicID = ""
    if (values.Count == 5) {
      wpsAddressPublicID = values[4]
    }

    return new AddressFlagsInstructionRecord(
        accID,
        contactPublicID,
        primaryAddressPublicID,
        cpcpxAddressPublicID,
        wpcAddressPublicID,
        wpsAddressPublicID)
  }

  override public function buildParameterCSV(record : AddressFlagsInstructionRecord) : String {
    return new StringBuilder(64)
        .append(record.ContactPublicID).append(",")
        .append(record.PrimaryAddressPublicID).append(",")
        .append(record.CPCPXAddressPublicID).append(",")
        .append(record.WPCAddressPublicID).append(",")
        .append(record.WPSAddressPublicID)
        .toString()
  }

}