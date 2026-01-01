package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord
uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

class ManualRetryInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID

  public construct(accID : String) {
    _accID = accID
  }

  override property get ACCID() : String {
    return _accID
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_IRMANUALRETRY
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_IR
  }

}