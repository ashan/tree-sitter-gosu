package wsi.remote.gw.webservice.bc

uses javax.xml.namespace.QName

uses gw.plugin.credentials.CredentialsUtil
uses gw.surepath.suite.integration.credentials.CredentialsKeys
uses gw.xml.ws.WsdlConfig
uses gw.xml.ws.IWsiWebserviceConfigurationProvider
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.security.authentication.KeyVaultAzureAPI

@Export
class BCConfigurationProvider implements IWsiWebserviceConfigurationProvider {

  override function configure(serviceName: QName, portName: QName, config: WsdlConfig) {
    config.Guidewire.Authentication.Username = CredentialsUtil.getCredentialsFromPlugin(CredentialsKeys.SUITE_BC_INTEGRATION.DisplayName).Username
    config.Guidewire.Authentication.Password = KeyVaultAzureAPI.isEnabled() ?
        ConfigurationProperty.PC_KEYVAULT_PASSWORD_ACCCOREINTUSER.PropertyValue :
        CredentialsUtil.getCredentialsFromPlugin(CredentialsKeys.SUITE_BC_INTEGRATION.DisplayName).Password
  }
}
