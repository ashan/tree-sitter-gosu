package nz.co.acc.common.integration.configurationservice

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.security.ACCKeyVaultAPI
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty



/**
 * Created by fabianr on 28/03/2017.
 * Loads all secure properties from KeyVault
 */
enum SecurePropertyLoader {
  Instance
  private static var _log = StructuredLogger.CONFIG.withClass(SecurePropertyLoader)

  function load() {
    var fn = "load"
    _log.info("Loading secure properties from KeyVault")
    if (!ConfigurationPropertyLoader.Singleton.IsInitialised) {
     _log.warn_ACC( "Unable to load secure properties, ConfigurationProperties must be loaded first")
      return
    }
    var api = new ACCKeyVaultAPI();
    try {
      var accessToken = api.getAccessToken()
      var secureProperties = ConfigurationProperty.AllValues.where(\elt -> elt.Secure)
      _log.info("Retrieving ${secureProperties.size()} secure properties from KeyVault")
      secureProperties.each(\key -> {
        _log.debug("Loading secret : ${key.SecretName} from ${key.KeyVaultName.PropertyValue}")
        var secret = api.getSecret(key.SecretName, key.KeyVaultName.PropertyValue, accessToken)
        if (secret != null) {
          ConfigurationPropertyLoader.Singleton.setValueFor(key.PropertyName, secret)
        } else {
          _log.warn_ACC( "${key.SecretName}: Not found in KeyVault, so will use what is in the local configuration file.")
        }
      })
    } catch (e: Exception) {
      _log.error_ACC( "Error connecting to KeyVault ${e.Message}")
    }
    _log.info("Finished loading secure properties")
  }

  function getConfigurationAppSecret(): String {
    var fn = "getConfigurationAppSecret"
    var appSecret = this.getAppConfiguration("app.client.secret")
    if (appSecret == null) {
      _log.info("App client secret from configuration will be used")
      appSecret = ConfigurationProperty.APP_CLIENT_SECRET.PropertyValue
    }
    return appSecret
  }

  function getConfigurationKeyVaulAppSecret(): String {
    var fn = "getConfigurationKeyVaulAppSecret"
    var vaultSecret = this.getAppConfiguration("vault.client.secret")
    if (vaultSecret == null) {
      _log.info("Keyvault client secret from configuration will be used")
      vaultSecret = ConfigurationProperty.VAULT_CLIENT_SECRET.PropertyValue
    }
    return vaultSecret
  }


  function getAppConfiguration(configKey: String): String {
    var fn = "getAppConfiguration"
    var appConfig = System.Properties.getProperty(configKey)
    if (appConfig != null && !appConfig.isEmpty()) {
      _log.info("${configKey} from environment variable will be use!")
      return appConfig
    }
    return null
  }


}
