package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord

class BlankPolicyChangeRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _productCode : String as ProductCode
  private var _levyYear : int as LevyYear

  construct(accID : String, productCode : String, levyYear : int) {
    this._accID = accID
    this._productCode = productCode
    this._levyYear = levyYear
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_BULKISSUEBLANKPOLICYCHANGE
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_FILE
  }
}