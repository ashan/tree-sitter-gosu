package nz.co.acc.validation

uses gw.util.GosuStringUtil

/**
 * Created by Mike Ourednik on 4/12/21.
 */
class CorrespondencePreferenceValidation {

  static function validateEmailVerifiedDate(contact : Contact) : String {
    if (contact.CorrespondencePreference_ACC == CorrespondencePreference_ACC.TC_EMAIL
        and not contact.IsEmailVerified) {
      return "Primary email address is not verified"
    }
    return null
  }
}