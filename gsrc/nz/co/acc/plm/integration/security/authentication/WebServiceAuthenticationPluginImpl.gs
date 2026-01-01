package nz.co.acc.plm.integration.security.authentication

uses com.guidewire.pl.system.dependency.PLDependencies
uses com.guidewire.pl.system.server.InitTab
uses gw.api.locale.DisplayKey
uses gw.api.system.server.Runlevel
uses gw.plugin.security.UserNamePasswordAuthenticationSource
uses gw.plugin.security.WebservicesAuthenticationContext
uses gw.plugin.security.WebservicesAuthenticationPlugin
uses gw.util.Base64Util
uses gw.util.Pair
uses gw.util.StreamUtil
uses gw.wsi.pl.ServerStateAPI
uses gw.wsi.pl.SystemToolsAPI
uses gw.xml.ws.WsiAuthenticationException
uses gw.xsd.guidewire.soapheaders.Authentication

/**
 * Serves as mechanism for web-service authentication - presently supports default and KeyVault authentications.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To use this authentication:
 * <ol>
 * <li>Send a web-service request.</li>
 * <li>Authentication will produce operation results in case of success and will throw exception in case of failure.</li>
 * </ol>
 * </p>
 * Created by nitesh.gautam on 29-Oct-17.
 */
class WebServiceAuthenticationPluginImpl implements WebservicesAuthenticationPlugin {

  override function authenticate(context: WebservicesAuthenticationContext): User {
    var user: User = null
    var authMethods: ArrayList<AuthenticationMethod> = new ArrayList()
    var authHeaders = context.getHttpHeaders().getHeader("Authorization")

    if (authHeaders != null) {
      var headersFromEnvelope = authHeaders.split(",")

      headersFromEnvelope.each(\header -> {
        var authentication = header.trim()
        authMethods.add(
            new WebServiceAuthenticationPluginImpl.UsernamePasswordAuthenticationMethod() {
              protected function getUsernamePassword(): Pair<String, String> {
                if (authentication.startsWith("Basic ")) {
                  var authString = authentication.substring(6)
                  var usernamePassword = StreamUtil.toString(Base64Util.decode(authString))
                  var idx = usernamePassword.indexOf(58)
                  if (idx < 0) {
                    throw new WsiAuthenticationException(DisplayKey.get("ext.Authentication.AzureKeyVault.ExpectedColonDelimitedUsernamePassword"))
                  } else {
                    var username = usernamePassword.substring(0, idx)
                    var password = usernamePassword.substring(idx + 1)
                    return new Pair(username, password)
                  }
                } else {
                  throw new WsiAuthenticationException(DisplayKey.get("ext.Authentication.AzureKeyVault.UnrecognizedHTTPAuthMethod", authentication))
                }
              }

              public function toString(): String {
                var descr = ""
                var idx = authentication.indexOf(32)
                if (idx > 0) {
                  descr = authentication.substring(0, idx + 1)
                }

                return "HTTP ${descr} Authentication"
              }
            }
        )
      })

    }

    var requestSoapHeaders = context.getRequestSoapHeaders()
    if (requestSoapHeaders != null) {
      final var authHeader = requestSoapHeaders.getChild(Authentication.$QNAME) as Authentication
      if (authHeader != null) {
        authMethods.add(new WebServiceAuthenticationPluginImpl.UsernamePasswordAuthenticationMethod() {
          protected function getUsernamePassword(): Pair<String, String> {
            return new Pair(authHeader.getUsername(), authHeader.getPassword())
          }

          public function toString(): String {
            return DisplayKey.get("ext.Authentication.AzureKeyVault.GuidewireSOAPHeaderAuthentication")
          }
        })
      }
    }

    if (!authMethods.isEmpty()) {
      if (authMethods.size() > 1) {
        throw new WsiAuthenticationException(DisplayKey.get("ext.Authentication.AzureKeyVault.MultipleAuthenticationMethods", authMethods))
      }

      user = authMethods.get(0).getUser()
    }

    return user
  }

  private static function authenticateUser(username: String, password: String): User {
    if (Runlevel.getCurrent().isEarlier(Runlevel.NODAEMONS)) {
      throw new WsiAuthenticationException(DisplayKey.get("ext.Authentication.AzureKeyVault.ServerMustBeAtNoDaemonsRunlevel"))
    } else {
      if (KeyVaultAzureAPI.isEnabled()) {
        //using KeyVault exception handling
        try {
          var authSource = new KeyVaultAuthenticationSource(username, password)
          return KeyVaultAzureAPI.keyVaultAuthentication(authSource)
        } catch (exception: Exception) {
          throw new WsiAuthenticationException(exception.getMessage())
        }
      } else {
        try {
          var ex = PLDependencies.getLoginManager().authenticateButDoNotLogin(new UserNamePasswordAuthenticationSource(username, password))
          return PLDependencies.getUserFinder().findByPublicID(ex)
        } catch (e: Exception) {
          throw new WsiAuthenticationException(DisplayKey.get("ext.Authentication.AzureKeyVault.AuthenticationError_ACC", username, e.Message))
        }
      }
    }
  }

  private abstract static class UsernamePasswordAuthenticationMethod implements WebServiceAuthenticationPluginImpl.AuthenticationMethod {
    private function UsernamePasswordAuthenticationMethod() {
    }

    protected abstract function getUsernamePassword(): Pair<String, String>

    public final function getUser(): User {
      var usernamePassword: Pair = this.getUsernamePassword()
      return WebServiceAuthenticationPluginImpl.authenticateUser(usernamePassword.getFirst() as String, usernamePassword.getSecond() as String)
    }
  }

  private interface AuthenticationMethod {
    public function getUser(): User
  }
}