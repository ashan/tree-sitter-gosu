package nz.co.acc.plm.integration.security.authentication

uses com.guidewire.pl.system.dependency.PLDependencies
uses com.guidewire.pl.system.service.context.ServiceToken
uses gw.api.locale.DisplayKey
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses gw.surepath.suite.integration.logging.StructuredLogger

uses javax.security.auth.login.FailedLoginException
uses java.lang.invoke.MethodHandles

/**
 * Serves as authentication provider for KeyVault authentication created via KeyVaultAuthenticationSource.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To use this provider for KeyVault authentication:
 * <ol>
 * <li>Initiate KeyVaultAuthenticationSource by passing user name and password.</li>
 * <li>KeyVault enablement can be checked using isEnabled().</li>
 * <li>User availability for KeyVault authentication can be checked using isUserInAuthList().</li>
 * <li>Credentials are authenticated using confirmCredentials().</li>
 * <li>Authentication result can be retrieved using keyVaultAuthentication() by passing KeyVaultAuthenticationSource object.</li>
 * </ol>
 * </p>
 * Created by nitesh.gautam on 27/10/2017.
 */
class KeyVaultAzureAPI implements IKeyVaultAPI {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  public static final var ERROR_GETTING_ACCESS_TOKEN: String = "Error getting access token"
  public static final var ERROR_USER_NOT_AVAILABLE: String = "User not available in KeyVault authentication list"
  public static final var ERROR_PERMISSION_DENIED: String = "Permission denied to access this application"
  public static final var ERROR_KEYVAULT_SERVER_NOT_AVAILABLE: String = "Authentication server is not available"
  public static final var ERROR_ACCESS_DENIED: String = "access_denied"
  public static final var ERROR_UNEXPECTED: String = "Unexpected Error"

  //Temporarily Configured to Configuration Properties parameters due to environment constraint
  private static var _userNamePropMap: Map<String, ConfigurationProperty>

  construct() {
    _userNamePropMap = new HashMap<String, ConfigurationProperty>()
    _userNamePropMap.put(ConfigurationProperty.PC_KEYVAULT_USER_SU.PropertyValue, ConfigurationProperty.PC_KEYVAULT_PASSWORD_SU)
    _userNamePropMap.put(ConfigurationProperty.PC_KEYVAULT_USER_ACCCOREINTUSER.PropertyValue, ConfigurationProperty.PC_KEYVAULT_PASSWORD_ACCCOREINTUSER)
    _userNamePropMap.put(ConfigurationProperty.PC_KEYVAULT_USER_ACCCONTROLMUSER.PropertyValue, ConfigurationProperty.PC_KEYVAULT_PASSWORD_ACCCONTROLMUSER)
    _userNamePropMap.put(ConfigurationProperty.PC_KEYVAULT_USER_ACCPORTALUSER.PropertyValue, ConfigurationProperty.PC_KEYVAULT_PASSWORD_ACCPORTALUSER)
  }

  public static function isEnabled(): Boolean {
    return (ScriptParameters.KeyVaultAuthenticationEnabled_ACC)
  }

  override function isUserInAuthList(user: String): Boolean {
    if (user == null or user.isEmpty() or ((new StringTokenizer(ScriptParameters.KeyVaultAuthenticationUsers_ACC, ","))?.toList() as ArrayList<String>).contains(user)) {
      return Boolean.TRUE
    } else {
      _logger.error_ACC( this + " " + "isUserInAuthList" + " " +
          ERROR_USER_NOT_AVAILABLE)
      throw new KeyVaultException(KeyVaultAzureAPI.ERROR_USER_NOT_AVAILABLE)
    }
  }

  override function confirmCredentials(userName: String, password: String): Boolean {
    if (_userNamePropMap.get(userName)?.PropertyValue?.compareTo(password) == 0) {
      return Boolean.TRUE
    } else {
      _logger.error_ACC(ERROR_ACCESS_DENIED)
      throw new KeyVaultException(KeyVaultAzureAPI.ERROR_ACCESS_DENIED)
    }
  }

  public static function keyVaultAuthentication(authSource: KeyVaultAuthenticationSource): User {
    var publicId: String = null
    // has error
    if (!authSource.ErrorMessage?.isEmpty()) {
      // Can add more add messsage to handle error
      if (authSource.ErrorMessage == KeyVaultAzureAPI.ERROR_USER_NOT_AVAILABLE) {
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureKeyVault.UserNotAvailable_ACC"))
      } else if (authSource.ErrorMessage == KeyVaultAzureAPI.ERROR_ACCESS_DENIED) {
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureKeyVault.AccessDenied_ACC"))
      } else
        throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureKeyVault.UnexpectedError_ACC"))
    }
    if (authSource.isAuthenticated) {
      StructuredLogger.INTEGRATION.info(null + " " + "keyVaultAuthentication" + " " + "User: ${authSource.Username} is authenticated via KeyVault")

      publicId = authSource.PublicID
    } else {
      StructuredLogger.INTEGRATION.error_ACC( null + " " + "keyVaultAuthentication" + " " + "Cannot Find the User : ${authSource.Username} in Guidewire")

      throw new FailedLoginException(DisplayKey.get("ext.Authentication.AzureKeyVault.UserNotFound_ACC", authSource.Username))
    }
    return authSource.User
  }

  public static function createServiceToken(user: User) : ServiceToken {
    return PLDependencies.getServiceTokenManager().createAuthenticatedToken(user)
  }

}