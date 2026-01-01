package edge.samlV2.authplugins

uses gw.plugin.security.AuthenticationServicePlugin
uses gw.plugin.security.AuthenticationServicePluginCallbackHandler
uses gw.plugin.security.AuthenticationSource
uses gw.plugin.security.UserNamePasswordAuthenticationSource
uses gw.plugin.InitializablePlugin
uses gw.api.util.Logger
uses java.util.HashSet
uses java.util.Set
uses gw.pl.exception.GWConfigurationException
uses java.lang.IllegalArgumentException
uses org.apache.commons.lang.StringUtils
uses gw.plugin.security.CredentialVerificationResult
uses javax.security.auth.login.FailedLoginException
uses java.util.Map
uses java.lang.Exception
uses edge.samlV2.base.plugins.BasePluginImpl

/**
 * SAML authentication service plugin,  this plugin provides the following features
 * - Has a (configurable) list of users that authenticate against the local database with u/p (See java doc for plugin registry keys / su always authenticates locally)
 * - Can consume a SAMLAuthenticationSource object to allow portal Signle Sign On
 * - Has a hook for the clients desired authentication mechanism
 *
 * @author bdubroy
 */
class SAMLAuthenticationServicePluginImpl extends BasePluginImpl implements AuthenticationServicePlugin, InitializablePlugin {
  /**
   * Class level logger used for ongoing log messaging,  and debug/trace logging
   */
  private static final var logger:org.slf4j.Logger = Logger.forCategory(SAMLAuthenticationServicePluginImpl.Type.DisplayName)

  /**
   * Variable holding the set of users to be authenticated locally against the Guidewire application system, Default: su is always authenticated locally
   */
  private var localUsers = new HashSet<String>()
  /**
   * This is the key used to look up the list of users to authenticate locally (Value: auth.saml.localUsers)
   */
  private static final var LOCAL_USERS_KEY = "auth.saml.localUsers"

  /**
   * Testing helper function to return a copy of the list of users that will be authenticated locally
   */
  protected property get NonSAMLUsers() : Set<String> {
    return localUsers.copy()
  }

  /**
   * Private variable to hold the plugin call back handler used to look up users
   */
  private var handler:AuthenticationServicePluginCallbackHandler = null

  /**
   * Constant holding the Guidewire super user default account that we always authenticate locally (Value: su)
   */
  private static final var GUIDEWIRE_SUPER_USER = "su"

  /**
   * Constructor for the class,  adds su to be authenticated locally by default
   */
  construct() {
    logger.info("#construct - SAML + Username/Password authentication is active")
    localUsers.add(GUIDEWIRE_SUPER_USER) // Always authenticate su locally
  }


  /**
   *  Interface method implementation<br><br>
   *
   * This method will authenticate in two ways,  for the internal 'su' or other excluded users,  it will authenticate against the GW application database, for all
   * other users SAML or the carrier default implementation of authentication.  It is up to the carrier to decide if they want to exclude locally authenticated users from SAML authentication
   *
   * @param source Authentication source containing credentials provided by "user" (be it interactive or computer) to authenticate
   * @returns PublicID of the user if they authenticate properly, null otherwise
   * @throws GWConfigurationException If no callback handler has been provided to the plugin yet
   * @throws IllegalArgumentException If the passed authentication source is not a UserNamePasswordAuthenticationSource
   */
  override function authenticate(source: AuthenticationSource): String {
    var publicId: String = null  // Default authorization is false

    //Ensure that we are able to interact as required with the application security/authentication subsystem, otherwise refuse to authenticate
    if(handler == null) {
      throw new GWConfigurationException("Unable to authenticate, callback handler is currently null")
    }

    //Process our two different types of responses
    if(source typeis SAMLAuthenticationSource) {  //If they have a saml assertion, they don't need to be validated locally or checked again if we have the assertion, we're good
      if(source.Authenticated) {
        logger.info("User " + source.Username + " authenticated via SAML assertion")
        publicId = source.PublicID
      } else {
        logger.warn("SAML assertion does not prove authentication, DENYING access")
      }
    } else if (source typeis UserNamePasswordAuthenticationSource) {
      var authSource = source as UserNamePasswordAuthenticationSource
      var userName = authSource.Username

      //If we are in development mode or the user is in the configured list of local users, do not look in elsewhere, authenticate locally, this is to both help local testing and prevent locking domain accounts from your local machine
      if (StringUtils.isNotBlank(userName) && (gw.api.system.server.ServerModeUtil.isDev() || localUsers.contains(userName.toLowerCase()))) {
        logger.warn("Authenticating user [" + userName + "] locally") //Useful for security monitoring        var tempUID = handler.findUser(userName)
        var tempUID = handler.findUser(userName)
        var res = handler.verifyInternalCredential(tempUID, authSource.getPassword());
        if (res != CredentialVerificationResult.SUCCESS) { //!res.equals(CredentialVerificationResult.SUCCESS) in Java
          logger.warn("Authentication for user ${userName} failed") //Useful for security monitoring
          throw new FailedLoginException("Error logging in")  // Do not nest exceptions to avoid leaking details via soap calls
        }
        publicId = tempUID
      } else {
        try {
          // CLIENT AUTHENTICATION INTEGRATION CODE GOES HERE
          logger.error("Fell through SAML + Local user authentication, User will not be authenticated, you must either 1 - Add the user to the list of locally authenticated users or 2 - Implement the clients preferred authentication strategy here")
        } catch (e:FailedLoginException) {
          logger.warn("Authentication for user ${userName} failed") //Useful for security monitoring
          logger.trace("Failed Login Details", e) // When tracing, provide full details
          throw new FailedLoginException("Error logging in") // Do not nest exceptions to avoid leaking details via soap calls
        }
      }
    } else {
      throw new IllegalArgumentException("Authentication source type " + (source as Object).Class.Name + " is not known to this plugin");
    }
    return publicId
  }

  /**
   * Helper function to extract any users that should be authenticated locally from the configuration and set them up
   *
   * @param params Map of parameters configured for this plugin
   */
  protected function extractLocalUsers(params:Map<String, String>) {
    var list = getValueOrDefault(params, LOCAL_USERS_KEY, null, false)
    if(StringUtils.isNotBlank(list)) {
      localUsers.addAll(splitAndTrimCSVString(list))
    }
  }

  override property set Callback(callbackHandler : AuthenticationServicePluginCallbackHandler) {
    handler = callbackHandler
  }

  /**
   * Interface method implementation to take in a configuration map, extract required/optional values, and handle errors if required.
   *
   * @param uncast Map of configuration values for this plugin as created in studio
   */
  override property set Parameters(map : Map) {
    var params:Map<String, String> = null
    try {
      params = map as Map<String, String>
    } catch (e:Exception) {
      throw new GWConfigurationException("Invalid configuration parameters specified to plugin", e)
    }

    extractLocalUsers(params)
    localUsers.each( \ user -> logger.warn("#setParameters: WARNING: User [" + user + "] will authenticate locally instead of using the default authentication mechanism") )
  }
}
