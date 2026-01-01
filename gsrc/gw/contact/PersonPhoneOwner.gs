package gw.contact

uses gw.api.name.ContactNameFields
uses gw.api.name.PersonNameFields
uses gw.api.phone.StandardPhoneOwner
uses gw.api.phone.PhoneFields
uses gw.api.phone.PhoneOwnerFieldId

@Export
class PersonPhoneOwner extends StandardPhoneOwner{
  var _isTypeRequired : boolean

  construct(fields : PhoneFields, label : String, isTypeRequired : boolean, personNameDelegate : PersonNameFields) {
    super(fields, label, isTypeRequired)
    _isTypeRequired = isTypeRequired
    Migrated_ACC = personNameDelegate.Migrated_ACC
  }

  construct(fields : PhoneFields, label : String, isTypeRequired : boolean) {
    super(fields, label, isTypeRequired)
    _isTypeRequired = isTypeRequired
  }

  override function isRequired(fieldId : PhoneOwnerFieldId) : boolean {
    if(fieldId == PhoneOwnerFieldId.NATIONAL_SUBSCRIBER_NUMBER) {
      return _isTypeRequired and !Migrated_ACC
    } else {
      return false
    }
  }

  override function isRegionCodeRequired() : boolean {
    return false
  }
}
