package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord

class ValidForClaimsInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID

  public construct(accID: String) {
    _accID = accID
  }
  override property get ACCID() : String {
    return this._accID
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_VALIDFORCLAIMS
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_PREUPDATE
  }
}