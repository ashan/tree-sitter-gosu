package nz.co.acc.common.integration.security

uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

/**
 * Holds settings for an OAuth authentication.
 * Created by Nick on 22/05/2017.
 */
class OAuthProperties {

  var _authorizationDomain: String as readonly AuthorisationDomain
  var _tenantId: String as readonly TenantId
  var _clientId: String as readonly ClientId
  var _clientSecret: String as readonly ClientSecret
  var _username: String as readonly Username
  var _password: String as readonly Password
  var _resourceUri: String as readonly ResourceUri

  construct(authorizationDomain:String, tenantId:String, clientId:String, username:String, password:String, resourceUri:String) {
    _authorizationDomain = authorizationDomain
    _tenantId = tenantId
    _clientId = clientId
    _username = username
    _password = password
    _resourceUri = resourceUri
  }

}