package nz.co.acc.plm.integration.apimgmt.payloadgen

uses entity.Address
uses nz.co.acc.common.GenericConstants
uses nz.co.acc.common.integration.apimgmt.json.JSONAddress
uses nz.co.acc.common.integration.apimgmt.payloadgen.AbstractPayloadGenerator
uses nz.co.acc.common.integration.apimgmt.payloadgen.GenFlags

uses java.text.SimpleDateFormat

/**
 * Payload generator for the Address entity.
 */
class AddressPayloadGenerator extends AbstractPayloadGenerator<JSONAddress, Address> {

  construct(address: Address) {
    super(address);
  }

  override function generate(flags: GenFlags[]): JSONAddress {
    if (entity == null) {
      return null
    }

    // Nullifies dummy-address fillers, if exists
    var cleanseDummy: block(s: String): String = \s -> GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(s) ? null : s
    var pAddress = new JSONAddress()

    pAddress.LinkID = entity.getLinkID()
    pAddress.AddressLine1 = cleanseDummy(entity.AddressLine1)
    pAddress.AddressLine2 = entity.AddressLine2
    pAddress.AddressLine3 = entity.AddressLine3
    pAddress.PostCode = cleanseDummy(entity.PostalCode)
    pAddress.AttnOrCo = entity.Attention_ACC
    pAddress.City = cleanseDummy(entity.City)
    pAddress.State = entity.State.DisplayName
    pAddress.Country = cleanseDummy(entity.Country.DisplayName)
    pAddress.Type = entity.AddressType.Code
    pAddress.LocationType = entity.AddressLocType_ACC.Code
    pAddress.UpdateTime = new SimpleDateFormat(GenericConstants.ISO8601_TIMESTAMP_PATTERN).format(entity.UpdateTime)

    return pAddress
  }

}