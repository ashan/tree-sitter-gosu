package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.RenewalInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
class RenewalInstructionRecordMapper implements InstructionRecordMapper<RenewalInstructionRecord> {

  override public function fromCSV(parser : CSVParser) : RenewalInstructionRecord {
    var accID = parser.nextString()
    var productCode = parser.nextString()

    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(productCode)) {
      throw new InvalidFieldException("ProductCode is blank")
    }

    return new RenewalInstructionRecord(
        accID,
        productCode,
        InstructionSource_ACC.TC_FILE)
  }

  override public function fromEntity(instructionRecord : InstructionRecord_ACC) : RenewalInstructionRecord {
    var accID = instructionRecord.ACCID
    var parameters = instructionRecord.Parameters

    var values : String[]
    if (parameters != null) {
      values = parameters.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 1) {
      throw new DisplayableException("Parameters[${parameters}] is not valid!")
    }
    var productCode = values[0]

    return new RenewalInstructionRecord(
        accID,
        productCode,
        instructionRecord.Source)
  }

  override public function buildParameterCSV(record : RenewalInstructionRecord) : String {
    return record.ProductCode.Code
  }

}