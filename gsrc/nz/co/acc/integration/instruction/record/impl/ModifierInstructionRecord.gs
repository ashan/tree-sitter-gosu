package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord
uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

uses java.math.BigDecimal

/**
 * Created by Mike Ourednik on 5/02/2021.
 */
class ModifierInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _productCode : String as readonly ProductCode
  private var _levyYear : Integer as readonly LevyYear
  private var _runId : Long as readonly RunID
  private var _modifier : BigDecimal as readonly Modifier
  private var _programme : String as readonly Programme
  private var _manualFlag : Boolean as readonly ManualFlag
  private var _calcTypeCode : String as readonly CalcTypeCode
  private var _jobType : String as readonly JobType
  private var _source: InstructionSource_ACC as readonly InstructionSource

  public construct(
      accID : String,
      productCode : String,
      levyYear : Integer,
      runId : Long,
      modifier : BigDecimal,
      programme : String,
      manualFlag : Boolean,
      calcTypeCode : String,
      jobType : String,
      source: InstructionSource_ACC) {
    _accID = accID
    _productCode = productCode
    _levyYear = levyYear
    _runId = runId
    _modifier = modifier
    _programme = programme
    _manualFlag = manualFlag
    _calcTypeCode = calcTypeCode
    _jobType = jobType
    _source = source
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_BULKMODIFIERUPLOAD
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("accID", _accID)
        .append("productCode", _productCode)
        .append("levyYear", _levyYear)
        .append("runId", _runId)
        .append("modifier", _modifier)
        .append("programme", _programme)
        .append("manualFlag", _manualFlag)
        .append("calcTypeCode", _calcTypeCode)
        .append("jobType", _jobType)
        .append("source", _source)
        .toString()
  }

}