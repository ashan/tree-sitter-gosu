package gw.api.address

/*
* Define properties here for fields added to AddressAutofillable.eti that are not defined in AddressFillable.
*
*/
@Export
interface AddressFillableExtension extends AddressFillable {

  property get AddressLine1Kanji() : String
  property set AddressLine1Kanji(value : String)

  property get AddressLine2Kanji() : String
  property set AddressLine2Kanji(value : String)

  property get CityKanji() : String
  property set CityKanji(value : String)

  property get CEDEX() : Boolean
  property set CEDEX(value : Boolean)

  property get CEDEXBureau() : String
  property set CEDEXBureau(value : String)

  property get Attention_ACC() : String
  property set Attention_ACC(value : String)

  property get ValidUntil_ACC() : Date
  property set ValidUntil_ACC(value : Date)

  property get AddressFinder_ACC() : String {return null}
  property set AddressFinder_ACC(value : String) {}

  property get PhysicalAddressSameAsPostalAddress_ACC() : boolean { return true }

  property set PhysicalAddressSameAsPostalAddress_ACC(value : boolean) {}

  property get SelectedAddressPhysical_ACC() : boolean { return true }

  property set SelectedAddressPhysical_ACC(value : boolean) {}

  property get BoxTypeExists_ACC() : boolean { return true }

  property set BoxTypeExists_ACC(value : boolean) {}
}
