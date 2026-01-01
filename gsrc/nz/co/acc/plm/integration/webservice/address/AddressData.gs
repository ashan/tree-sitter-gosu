package nz.co.acc.plm.integration.webservice.address

uses entity.Address
uses gw.util.GosuStringUtil
uses nz.co.acc.common.GenericConstants

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

@gw.xml.ws.annotation.WsiExportable("http://acc.co.nz/pc/ws/nz/co/acc/plm/integration/webservice/address/AddressData")
@Export
final class AddressData {
  private static var _log = StructuredLogger.INTEGRATION.withClass(AddressData)

  var _addressLine1 : String as AddressLine1
  var _addressLine2 : String as AddressLine2
  var _addressLine3 : String as AddressLine3
  var _attention_ACC : String as Attention_ACC
  var _city : String as City
  var _state : State as State
  var _postalCode : String as PostalCode
  var _country : Country as Country
  var _addressValidUntil : Date as AddressValidUntil
  var _primaryEmail : String as PrimaryEmail
  var _isEmailVerified : Boolean as IsEmailVerified
  var _correspondencePreference : String as CorrespondencePreference
  var _hasValidCorrespondenceDetails : Boolean as HasValidCorrespondenceDetails

  construct(account : Account, address : Address) {
    if (address != null) {
      _addressLine1 = GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(address.AddressLine1) ? null : address.AddressLine1
      _addressLine2 = GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(address.AddressLine2) ? null : address.AddressLine2
      _addressLine3 = GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(address.AddressLine3) ? null : address.AddressLine3
      _city = GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(address.City) ? null : address.City
      _state = address.State
      _postalCode = GenericConstants.DUMMY_ADDRESS_FILLER.equalsIgnoreCase(address.PostalCode) ? null : address.PostalCode
      _country = ((address.Country == typekey.Country.TC_UNKNOWN_ACC) or (address.Country == typekey.Country.TC_UNKNOWN)) ? null : address.Country
      _attention_ACC = account.PrimaryContactsAttentionField_ACC
      _addressValidUntil = address.ValidUntil
      // updateCity()
    }
    var primaryContact = account.PrimaryContact_ACC
    _primaryEmail = primaryContact.EmailAddress1
    _isEmailVerified = primaryContact.EmailVerifiedDate_ACC != null
    _correspondencePreference = primaryContact.CorrespondencePreference_ACC.DisplayName

    if ( primaryContact.CorrespondencePreference_ACC == CorrespondencePreference_ACC.TC_MAIL) {
      _hasValidCorrespondenceDetails = address != null and not address.IsGNA
    } else {
      _hasValidCorrespondenceDetails = true
    }
  }

  private function updateCity() {
    if (this.State != null) {
      if (GosuStringUtil.isBlank(this.City)) {
        this.City = this.State.DisplayName
      } else {
        this.City = this.City + " " + this.State.DisplayName
      }
    }
  }

}
