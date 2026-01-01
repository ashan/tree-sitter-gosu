package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses nz.co.acc.integration.instruction.record.impl.BulkWPCEarningChangeRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

uses java.math.BigDecimal

class BulkWPCEarningChangeRecordMapper implements InstructionRecordMapper<BulkWPCEarningChangeRecord> {

  override function fromCSV(parser : CSVParser) : BulkWPCEarningChangeRecord {
    var accID = parser.nextString().trim()
    var levyYear = parser.nextInt()
    var totalGrossEarnings = parser.nextString().toBigDecimal()
    var totalNotLiableEarnings = parser.nextString().toBigDecimal()
    var totalScheduledPmnt = parser.nextString().toBigDecimal()
    var totalExcess = parser.nextString().toBigDecimal()
    //optional fields
    var firstWeek : BigDecimal = null
    var firstWeekStr = parser.nextString()
    if (!firstWeekStr.Blank) {
      firstWeek = firstWeekStr.toBigDecimal()
    }
    var postWeek : BigDecimal = null
    var postWeekStr = parser.nextString()
    if (!postWeekStr.Blank) {
      postWeek = postWeekStr.toBigDecimal()
    }

    return new BulkWPCEarningChangeRecord(
        accID,
        levyYear,
        totalGrossEarnings,
        totalNotLiableEarnings,
        totalScheduledPmnt,
        totalExcess,
        firstWeek,
        postWeek)
  }

  override function fromEntity(instructionRecord : InstructionRecord_ACC) : BulkWPCEarningChangeRecord {
    var accID = instructionRecord.ACCID
    var parameters = instructionRecord.Parameters
    var splitParameters = parameters?.split(InstructionConstantHelper.CSV_DELIMITER)?.toList()
    if (splitParameters == null || splitParameters.size() < 2) {
      throw new DisplayableException("Parameters[${parameters}] is not valid!")
    }

    var fields = splitParameters.listIterator()

    var levyYear = fields.next().toInt()
    var totalGrossEarnings = fields.next().toBigDecimal()
    var totalNotLiableEarnings = fields.next().toBigDecimal()
    var totalScheduledPmnt = fields.next().toBigDecimal()
    var totalExcess = fields.next().toBigDecimal()
    //optional fields
    var firstWeek : BigDecimal = null
    var firstWeekStr = fields.next()
    if (firstWeekStr != null and firstWeekStr != "null") {
      firstWeek = firstWeekStr.toBigDecimal()
    }
    var postWeek : BigDecimal = null
    var postWeekStr = fields.next()
    if (postWeekStr != null and postWeekStr != "null") {
      postWeek = postWeekStr.toBigDecimal()
    }

    return new BulkWPCEarningChangeRecord(
        accID,
        levyYear,
        totalGrossEarnings,
        totalNotLiableEarnings,
        totalScheduledPmnt,
        totalExcess,
        firstWeek,
        postWeek)
  }

  override function buildParameterCSV(record : BulkWPCEarningChangeRecord) : String {
    return new StringBuilder(64)
        .append(record.LevyYear).append(",")
        .append(record.TotalGrossEarnings).append(",")
        .append(record.TotalNotLiableEarnings).append(",")
        .append(record.TotalScheduledPmnt).append(",")
        .append(record.TotalExcess).append(",")
        .append(record.FirstWeek).append(",")
        .append(record.PostWeek)
        .toString()
  }
}