package nz.co.acc.common.integration.security.ui

uses gw.api.locale.DisplayKey
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.GetEnvironment

uses java.util.regex.Pattern

/**
 * Created by Chris Anderson on 17/02/2020.
 * JUNO-665 Increase GW password complexity
 */
class PasswordUIHelper_ACC {

  var _env : String

  construct() {
    _env = Funxion.buildGenerator(new GetEnvironment()).generate()
  }

  construct(env : String) {
    _env = env
  }

  function validatePassword(unencryptedPassword : String) : String {
    if (!_env.equalsIgnoreCase("dev")) {
      // This regex ensures at least 1 Upper case, 1 lower case, 1 special character and 1 number
      // To reduce complexity I've put the limit for >2 same characters in a row in a separate method
      final var passwordPattern = Pattern.compile("^(?=.*[0-9])(?=.*[A-Z])(?=.*[a-z])(?=.*[!@#$%^&*-+=])")

      // length is determined automagically by "MinPasswordLength" in config.xml
      // This method determines the complexity rules
      // Must contain 3 character sets. Apparently there are 6 classes:
      // Upper case UNO
      // lower case uno
      // Numbers    123
      // Special characters @$%
      // 8 bit characters
      // Number of repeated characters

      if (!passwordPattern.matcher(unencryptedPassword).find()) {
        return DisplayKey.get("Web.Admin.UserDetailDV.Password.Requirement")
      } else if (checkForMultipleChars(unencryptedPassword)) {
        return DisplayKey.get("Web.Admin.UserDetailDV.Password.Requirement.Sequence")
      } else if (checkForWhiteSpace(unencryptedPassword)) {
        return DisplayKey.get("Web.Admin.UserDetailDV.Password.Requirement.WhiteSpace")
      }
    }
    return null
  }

  private function checkForMultipleChars(unencryptedPassword : String) : boolean {
    // Check for >2 instances of the same character
    final var passwordPattern = Pattern.compile("([A-Za-z0-9!@#$%^&*-+=])\\1{2,}")
    var test = passwordPattern.matcher(unencryptedPassword).find()
    return test
  }

  private function checkForWhiteSpace(unencryptedPassword : String) : boolean {
    // Check for >2 instances of the same character
    final var passwordPattern = Pattern.compile("\\s")
    var test = passwordPattern.matcher(unencryptedPassword).find()
    return test
  }

}