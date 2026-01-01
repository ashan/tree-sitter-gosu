package nz.co.acc.integration.instruction.recordmapper.impl

uses gw.api.util.DisplayableException
uses gw.pl.util.csv.CSVParser
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.instruction.record.impl.ModifierInstructionRecord
uses nz.co.acc.integration.instruction.recordmapper.InstructionRecordMapper
uses nz.co.acc.integration.instruction.recordmapper.InvalidFieldException
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper

/**
 * Created by Mike Ourednik on 6/02/2021.
 */
class ModifierInstructionRecordMapper implements InstructionRecordMapper<ModifierInstructionRecord> {

  /**
   * Parse parameters from CSV.
   * <p>
   * CalcTypeCode field was added in NTK-6646 (released in V3.10, 2019-10-09)
   *
   * @param parser
   * @return
   */
  override public function fromCSV(parser : CSVParser) : ModifierInstructionRecord {
    var accID = parser.nextString()
    var productCode = parser.nextString()
    var levyYear = parser.nextInt()
    var runId = parser.nextLong()
    var modifier = parser.nextString().toBigDecimal()
    var programme = parser.nextString()
    var manualFlag = parser.nextString().toBoolean()
    var calcTypeCode = parser.hasMoreValues() ? parser.nextString() : ""
    var defaultJobType = InstructionConstantHelper.JOB_POLICYCHANGE

    if (GosuStringUtil.isBlank(accID)) {
      throw new InvalidFieldException("ACCID is blank")
    }
    if (GosuStringUtil.isBlank(productCode)) {
      throw new InvalidFieldException("ProductCode is blank")
    }
    if (GosuStringUtil.isBlank(programme)) {
      throw new InvalidFieldException("Programme is blank")
    }

    return new ModifierInstructionRecord(
        accID,
        productCode,
        levyYear,
        runId,
        modifier,
        programme,
        manualFlag,
        calcTypeCode,
        defaultJobType,
        InstructionSource_ACC.TC_FILE)
  }

  override public function fromEntity(instructionRecord : InstructionRecord_ACC) : ModifierInstructionRecord {
    var accID = instructionRecord.ACCID
    var parameters = instructionRecord.Parameters

    var splitParameters = parameters?.split(InstructionConstantHelper.CSV_DELIMITER)?.toList()
    if (splitParameters == null or splitParameters.size() < 7 or splitParameters.size() > 8) {
      throw new DisplayableException("Parameters[${parameters}] is not valid!")
    }

    final var hasCalcTypeCode = splitParameters.size() == 8
    var fields = splitParameters.listIterator()

    var productCode = fields.next()
    var levyYear = fields.next().toInt()
    var runId = fields.next().toLong()
    var modifier = fields.next().toBigDecimal()
    var programme = fields.next()
    var manualFlag = fields.next().toBoolean()
    var calcTypeCode = hasCalcTypeCode ? fields.next() : ""
    var jobType = fields.next()

    if (programme != InstructionConstantHelper.PROGRAMME_KEY_STANDARD &&
        programme != InstructionConstantHelper.PROGRAMME_KEY_EXPERIENCERATING &&
        programme != InstructionConstantHelper.PROGRAMME_KEY_NOCLAIMSDISCOUNT) {
      throw new DisplayableException("Programme ${programme} is not valid!")
    }

    return new ModifierInstructionRecord(
        accID,
        productCode,
        levyYear,
        runId,
        modifier,
        programme,
        manualFlag,
        calcTypeCode,
        jobType,
        instructionRecord.Source)
  }

  override public function buildParameterCSV(record : ModifierInstructionRecord) : String {
    return new StringBuilder(128)
        .append(record.ProductCode).append(",")
        .append(record.LevyYear).append(",")
        .append(record.RunID).append(",")
        .append(record.Modifier).append(",")
        .append(record.Programme).append(",")
        .append(record.ManualFlag).append(",")
        .append(record.CalcTypeCode).append(",")
        .append(InstructionConstantHelper.JOB_POLICYCHANGE)
        .toString()
  }

}