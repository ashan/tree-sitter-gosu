package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses entity.Address
uses nz.co.acc.common.GenericConstants
uses nz.co.acc.edge.capabilities.helpers.AddressUtil_ACC
uses nz.co.acc.integration.junoinformationservice.model.account.GSONAddress

/**
 * Payload generator for the Address entity.
 */
class AddressGsonGenerator {

  function generate(entity: Address) : GSONAddress {
    if (entity == null) {
      return null
    }

    // Nullifies dummy-address fillers, if exists
    var cleanseDummy : block(s : String) : String = \s -> GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(s) ? null : s
    var gsonDoc = new GSONAddress()

    gsonDoc.publicId = entity.PublicID
    gsonDoc.addressLine1 = cleanseDummy(entity.AddressLine1)
    gsonDoc.addressLine2 = entity.AddressLine2
    gsonDoc.addressLine3 = entity.AddressLine3
    gsonDoc.postCode = cleanseDummy(entity.PostalCode)
    gsonDoc.attnOrCo = entity.Attention_ACC
    gsonDoc.city = cleanseDummy(entity.City)
    gsonDoc.state = entity.State.DisplayName
    gsonDoc.country = cleanseDummy(entity.Country.DisplayName)
    gsonDoc.addressType = entity.AddressType.Code
    gsonDoc.addressPolicyType = entity.AddressPolicyType_ACC.Code
    gsonDoc.isCpCpx = entity.IsCPCPXAddress_ACC
    gsonDoc.isWpc = entity.IsWPCAddress_ACC
    gsonDoc.isWps = entity.IsWPSAddress_ACC
    gsonDoc.locationType = entity.AddressLocType_ACC.Code
    gsonDoc.validUntil = entity.ValidUntil?.toISODate()
    gsonDoc.isValid = not AddressUtil_ACC.isAddressInvalid(entity)
    gsonDoc.updateTime = entity.UpdateTime.toISOTimestamp()

    return gsonDoc
  }

}