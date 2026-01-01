package nz.co.acc.phone

uses gw.api.phone.PhoneFields
uses gw.api.phone.PhoneOwnerFieldId
uses gw.api.phone.StandardPhoneOwner

@Export
class BusinessGroupPhoneOwner_ACC extends StandardPhoneOwner {
  construct(fields : PhoneFields) {
    super(fields)
  }
  construct(fields : PhoneFields, label : String) {
    super(fields, label)
  }

  construct(fields : PhoneFields, required : boolean) {
    super(fields, required)
  }

  construct(fields : PhoneFields, label : String, required : boolean){
    super(fields, label, required)
  }

  override property get HiddenFields() : Set<PhoneOwnerFieldId> {
    return PhoneOwnerFieldId.EMPTY_FIELDS
  }

}
