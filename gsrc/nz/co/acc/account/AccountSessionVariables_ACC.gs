package nz.co.acc.account

uses gw.api.web.SessionVar

/**
 * Class to hold account session variables.
 */
class AccountSessionVariables_ACC {

  static var _policyTermYear = new SessionVar<String>()

  static property get PolicyTermYear() : String {
    if (_policyTermYear.RequestAvailable) {
      return _policyTermYear.get()
    } else {
      return null
    }
  }

  static property set PolicyTermYear(value : String) {
    if (_policyTermYear.RequestAvailable) {
      _policyTermYear.set(value)
    }
  }

}