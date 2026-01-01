package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.InstructionRecord
uses nz.co.acc.integration.instruction.record.impl.BlankPolicyChangeRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

class BlankPolicyChangeRecordMapper implements InstructionRecordMapper<BlankPolicyChangeRecord> {

  override function fromCSV(parser : CSVParser) : BlankPolicyChangeRecord {
    var accID = parser.nextString()
    var productCode = parser.nextString()
    var levyYear = parser.nextInt()
    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(productCode)) {
      throw new InvalidFieldException("ProductCode is blank")
    }
    return new BlankPolicyChangeRecord(accID, productCode, levyYear)
  }

  override function fromEntity(instructionRecord : InstructionRecord_ACC) : BlankPolicyChangeRecord {
    var accID = instructionRecord.ACCID
    var parameters = instructionRecord.Parameters

    var values : String[]
    if (parameters != null) {
      values = parameters.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 2) {
      throw new DisplayableException("Parameters[${parameters}] is not valid!")
    }
    var productCode = values[0]
    var levyYear = Integer.valueOf(values[1])

    return new BlankPolicyChangeRecord(
        accID,
        productCode,
        levyYear)
  }

  override function buildParameterCSV(record : BlankPolicyChangeRecord) : String {
    return new StringBuilder(32)
        .append(record.ProductCode).append(",")
        .append(record.LevyYear)
        .toString()
  }
}