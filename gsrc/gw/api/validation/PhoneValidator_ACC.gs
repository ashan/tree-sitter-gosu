package gw.api.validation

uses gw.api.locale.DisplayKey
uses gw.api.util.PhoneUtil
uses nz.co.acc.util.StringUtil_ACC

@Export
class PhoneValidator_ACC extends FieldValidatorBase {

  construct() {
  }

  override function validate(phoneNumber : String, p1 : Object, parameters : Map<Object, Object>) : IFieldValidationResult {
    var countryProperty = parameters.get("phonecountrycodeProperty") as String
    var phoneCountry : PhoneCountryCode = null
    var result = new FieldValidationResult()

    if (countryProperty != null) {
      phoneCountry = p1[countryProperty] as PhoneCountryCode
    }

    validate_ACC(phoneNumber, phoneCountry).each(\error -> result.addError(error))

    return result
  }

  static function validate_ACC(phoneNumber : String, phoneCountry : PhoneCountryCode) : Optional<String> {
    if (phoneCountry != null
        and phoneCountry != PhoneCountryCode.TC_ZZ
        and phoneCountry != PhoneCountryCode.TC_UNPARSEABLE) {

      if (!phoneNumber.Numeric or phoneNumber.length < 8 or phoneNumber.length > 15) {
        return Optional.of(DisplayKey.get("Validator.Phone.NotViable", phoneNumber))
      }

      if (!PhoneUtil.isViableNumber(phoneNumber)) {
        return Optional.of(DisplayKey.get("Validator.Phone.NotViable", phoneNumber))
      }
    }
    return Optional.empty()
  }

  static function isPossibleNumber_ACC(phoneNumber : String, phoneCountry : PhoneCountryCode) : boolean {
    var cleanPhoneNumber = StringUtil_ACC.filterNonDigits(phoneNumber)
    return validate_ACC(cleanPhoneNumber, phoneCountry).Empty
  }

}
