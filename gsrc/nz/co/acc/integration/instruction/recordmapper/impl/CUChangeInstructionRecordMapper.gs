package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.CUChangeInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
class CUChangeInstructionRecordMapper implements InstructionRecordMapper<CUChangeInstructionRecord> {

  override public function fromCSV(parser : CSVParser) : CUChangeInstructionRecord {
    var accID = parser.nextString()
    var productCode = parser.nextString()
    var levyYear = parser.nextInt()
    var bicCode = parser.nextString()

    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(productCode)) {
      throw new InvalidFieldException("ProductCode is blank")
    }

    return new CUChangeInstructionRecord(
        accID,
        productCode,
        levyYear,
        bicCode,
        InstructionSource_ACC.TC_FILE)
  }

  override public function fromEntity(instructionRecord : InstructionRecord_ACC) : CUChangeInstructionRecord {
    var accID = instructionRecord.ACCID
    var parameters = instructionRecord.Parameters

    var values : String[]
    if (parameters != null) {
      values = parameters.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 3) {
      throw new DisplayableException("Parameters[${parameters}] is not valid!")
    }
    var productCode = values[0]
    var levyYear = Integer.valueOf(values[1])
    var bicCode = values[2]

    return new CUChangeInstructionRecord(
        accID,
        productCode,
        levyYear,
        bicCode,
        instructionRecord.Source)
  }

  override public function buildParameterCSV(record : CUChangeInstructionRecord) : String {
    return new StringBuilder(32)
        .append(record.ProductCode).append(",")
        .append(record.LevyYear).append(",")
        .append(record.BICCode)
        .toString()
  }

}