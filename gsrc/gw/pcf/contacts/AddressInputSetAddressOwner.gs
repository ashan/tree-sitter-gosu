package gw.pcf.contacts

uses gw.api.address.AddressOwnerFieldId

/**
 * {@link gw.api.address.AddressOwner} implementation on {@link Address}
 */
@Export
class AddressInputSetAddressOwner extends AbstractInputSetAddressOwner {
  private static final var ALWAYS_EDITABLE_FIELDS = new HashSet <AddressOwnerFieldId>(){ AddressOwnerFieldId.VALIDUNTIL }.freeze()

  var _address : Address

  construct(theAddress : Address, isNonSpecific : boolean, isMovable : boolean) {
    super(isNonSpecific, isMovable)
    _address = theAddress
    Migrated_ACC = theAddress.Migrated_ACC
  }

  override property get Address(): entity.Address {
    return _address
  }

  override property set Address(value: entity.Address) {
    _address = value
  }

  override function isEditable(fieldId : AddressOwnerFieldId) : boolean {
    return !nonEditableFields().contains(fieldId) and (ALWAYS_EDITABLE_FIELDS.contains(fieldId) or _address.AddressType != AddressType.TC_IRACC)
  }


}
