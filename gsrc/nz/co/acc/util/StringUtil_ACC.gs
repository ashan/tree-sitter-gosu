package nz.co.acc.util

uses java.util.regex.Pattern

class StringUtil_ACC {
  final static var NON_DIGIT_PATTERN = Pattern.compile("\\D")

  static function filterNonDigits(phoneNumber : String) : String {
    if (phoneNumber == null) {
      return null
    } else {
      return NON_DIGIT_PATTERN.matcher(phoneNumber).replaceAll("")
    }
  }

}