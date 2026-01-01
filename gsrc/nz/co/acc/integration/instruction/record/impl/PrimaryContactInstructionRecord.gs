package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord

class PrimaryContactInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _primaryContactPublicId : String as readonly PrimaryContactPublicId

  public construct(accID: String, primaryContactPublicId: String) {
    _accID = accID
    _primaryContactPublicId = primaryContactPublicId
  }
  override property get ACCID() : String {
    return this._accID
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_BULKEDITPRIMARYCONTACT
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_FILE
  }
}