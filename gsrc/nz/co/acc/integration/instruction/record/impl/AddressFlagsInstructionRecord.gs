package nz.co.acc.integration.instruction.record.impl

uses nz.co.acc.integration.instruction.record.InstructionRecord
uses org.apache.commons.lang3.builder.ToStringBuilder
uses org.apache.commons.lang3.builder.ToStringStyle

class AddressFlagsInstructionRecord implements InstructionRecord {
  private var _accID : String as readonly ACCID
  private var _contactPublicID : String as readonly ContactPublicID
  private var _primaryAddressPublicID : String as readonly PrimaryAddressPublicID
  private var _cpcpxAddressPublicID : String as readonly CPCPXAddressPublicID
  private var _wpcAddressPublicID : String as readonly WPCAddressPublicID
  private var _wpsAddressPublicID : String as readonly WPSAddressPublicID

  public construct(
      accID: String,
      contactPublicID: String,
      primaryAddressPublicID: String,
      cpcpxAddressPublicID: String,
      wpcAddressPublicID: String,
      wpsAddressPublicID: String) {
    _accID = accID
    _contactPublicID = contactPublicID
    _primaryAddressPublicID = primaryAddressPublicID
    _cpcpxAddressPublicID = cpcpxAddressPublicID
    _wpcAddressPublicID = wpcAddressPublicID
    _wpsAddressPublicID = wpsAddressPublicID
  }

  override property get InstructionType() : InstructionType_ACC {
    return InstructionType_ACC.TC_ADDRESSFLAGS
  }

  override property get InstructionSource() : InstructionSource_ACC {
    return InstructionSource_ACC.TC_FILE
  }

  override function toString() : String {
    return new ToStringBuilder(this, ToStringStyle.SHORT_PREFIX_STYLE)
        .append("accID", _accID)
        .append("contactPublicID", _contactPublicID)
        .append("primaryAddressPublicID", _primaryAddressPublicID)
        .append("cpcpxAddressPublicID", _cpcpxAddressPublicID)
        .append("wpcAddressPublicID", _wpcAddressPublicID)
        .append("wpsAddressPublicID", _wpsAddressPublicID)
        .toString()
  }
}