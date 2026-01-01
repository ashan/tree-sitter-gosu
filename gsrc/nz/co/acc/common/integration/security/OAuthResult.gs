package nz.co.acc.common.integration.security


/**
 * Holds the result of the OAuth successful results.
 * Created by Nick on 7/09/2017.
 */
class OAuthResult {
  var _accessToken: OAuthToken as AccessToken
  var _refreshToken: OAuthToken as RefreshToken

  construct(accessToken: OAuthToken, refreshToken: OAuthToken) {
    _accessToken = accessToken
    _refreshToken = refreshToken
  }

  function isAccessTokenValid(): boolean {
    return _accessToken?.isValid()
  }

  function isRefreshTokenValid(): boolean {
    return _refreshToken.isValid()
  }

  function isRefreshTokenSupported(): boolean {
    return _refreshToken?.Token!=null
  }

  function update(otherOAuthResult: OAuthResult) {
    _accessToken = otherOAuthResult.AccessToken
    _refreshToken = otherOAuthResult.RefreshToken
  }

  override function toString(): String {
    return "OAuthResult >> AccessToken[${_accessToken?.toString()}] and RefreshToken[${_refreshToken?.toString()}]"
  }
}