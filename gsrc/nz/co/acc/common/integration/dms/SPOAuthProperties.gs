package nz.co.acc.common.integration.dms

uses nz.co.acc.common.integration.security.OAuthProperties
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

/**
 * Created by Nick on 22/05/2017.
 */
class SPOAuthProperties extends OAuthProperties {

  construct() {
    super(ConfigurationProperty.DMS_OAUTH_AUTHORIZATION_DOMAIN.PropertyValue,
        ConfigurationProperty.DMS_OAUTH_TENANT_ID.PropertyValue,
        ConfigurationProperty.DMS_OAUTH_CLIENT_ID.PropertyValue,
        ConfigurationProperty.DMS_OAUTH_USERNAME.PropertyValue,
        ConfigurationProperty.DMS_OAUTH_PASSWORD.PropertyValue,
        ConfigurationProperty.DMS_OAUTH_RESOURCE_URI.PropertyValue)
  }

}