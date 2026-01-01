package nz.co.acc.common.integration.security

uses gw.api.util.DateUtil
uses gw.i18n.DateTimeFormat

/**
 * This class holds important AccessToken (and RefreshToken) details for OAuth
 * so that our Guidewire and external REST API's can communicate.
 * <p>
 * Created by Nick Mei on 14/02/2017.
 */
class OAuthToken {

  static var MINUS_MINUTES_BEFORE_TOKEN_EXPIRES = -2

  var _token: String as readonly Token = null
  var _expiresAt: Date as readonly ExpiresOn = null

  construct (token: String) {
    _token = token
  }

  construct (token: String, expiresAt: Date) {
    _token = token
    _expiresAt = expiresAt
  }

  public function isValid(): boolean {
    var isValid = false
    if (_token != null and _token.HasContent) {
      if (_expiresAt != null) {
        isValid = DateUtil.currentDate().beforeOrEqual(_expiresAt.addMinutes(MINUS_MINUTES_BEFORE_TOKEN_EXPIRES))
      } else {
        // If no expiry date assume token last forever.
        isValid = true
      }
    }
    return isValid
  }

  override function toString(): String {
    if (_token != null) {
      var length = _token.length()
      return "Token=${_token.substring(0,10)}...${_token.substring(length - 10)}, ExpiresOn=${_expiresAt?.formatDateTime(DateTimeFormat.SHORT, DateTimeFormat.SHORT)}"
    } else {
      return "Token is null."
    }
  }
}