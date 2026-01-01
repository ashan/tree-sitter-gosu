package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord

class DocumentRemovalInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _documentPublicID : String as readonly DocumentPublicID

  construct(accID : String, documentPublicID : String) {
    this._accID = accID
    this._documentPublicID = documentPublicID
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_DOCUMENTREMOVAL
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_FILE
  }
}