package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord
uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

class AddressEndDateInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _addressPublicID : String as readonly AddressPublicID

  public construct(accID: String, addressPublicID: String) {
    _accID = accID
    _addressPublicID = addressPublicID
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_ADDRESSENDDATE
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_FILE
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("accID", _accID)
        .append("addressPublicID", _addressPublicID)
        .toString()
  }
}