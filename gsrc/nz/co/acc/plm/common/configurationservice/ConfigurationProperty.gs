package nz.co.acc.plm.common.configurationservice

uses gw.util.GosuStringUtil
uses nz.co.acc.common.integration.configurationservice.ConfigurationPropertyLoader

/**
 * This is the home for all the properties exposed by the configuration properties service.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To add a new property that needs to be read from an external properties file:
 * <ol>
 * <li>Add your property name and value to the appropriate properties file under config/properties/ directory.</li>
 * <li>Add a constant to this enum to represent your new property and specify a default value. If no default values should exists, set it as {@code null}.</li>
 * <li>Now you can call YOUR_ENUM_CONSTANT.PropertyValue in your code to read the value injected externally.</li>
 * </ol>
 * <p>
 * See Internal Tools > Configuration Properties view to list all the properties loaded to the instance.
 * <p>
 * Created by Kaushalya Samarasekera
 */
enum ConfigurationProperty {

  //=== Configuration Property Definitions =============================================================================

  // Here are some examples. Also used for the unit tests.
  EXAMPLE_ACC_CLUSTER_NAME("example.acc.cluster.name", "DefaultClusterName"),
  EXAMPLE_ACC_CLUSTER_DISCOVERY_AUTO("example.acc.cluster.discovery.auto", "false"),
  EXAMPLE_ACC_CLUSTER_DISCOVERY_ATTEMPTS("example.acc.cluster.discovery.attempts", "10"),

  //End of examples

  // APP Registration in AD
  APP_REDIRECT_URL("app.redirect.url"),
  APP_TENANT_ID("app.tenant.id"),
  //These will be overridden when gw.app.id and gw.app.secret are set in gw environment variables, appId and secret are used for AD and Keyvault
  APP_CLIENT_ID("app.client.id"),
  APP_CLIENT_SECRET("app.client.secret"),
  //Home page when user logout
  EXTERNAL_AUTHENTICATION_HOMPAGE_URL("external.authentication.homepage.url"),
  AZURE_AD_AUTHORITY_URL("azure.ad.authority.url", "https://login.windows.net/"),
  AZURE_AD_GRAPH_URL("azure.ad.graph.url", "https://graph.windows.net/"),
  AZURE_AD_GRAPH_VERSION("azure.ad.graph.version", "2013-04-05"),

  //Azure keyvault configuration
  PC_KEYVAULT("pc.keyvault.name"),
  VAULT_URI("vault.uri"),
  VAULT_API_VERSION("vault.api.version"),
  VAULT_AUTHORIZATION_DOMAIN("vault.authorization.domain"),
  VAULT_CLIENT_ID("vault.client.id"),
  VAULT_CLIENT_SECRET("vault.client.secret"),
  VAULT_TENANT_ID("vault.tenantId"),

  //KeyVault users
  PC_KEYVAULT_USER_SU("PCKeyVaultUserSu", "su"),
  PC_KEYVAULT_PASSWORD_SU("PCPasswordSu", "gw", "PCPasswordSu", true, PC_KEYVAULT),
  PC_KEYVAULT_USER_ACCCOREINTUSER("PCUserAcccoreintuser", "acccoreintuser"),
  PC_KEYVAULT_PASSWORD_ACCCOREINTUSER("PCPasswordAcccoreintuser", "eN3ctk#PuH0WzbD", "PCPasswordAcccoreintuser", true, PC_KEYVAULT),
  PC_KEYVAULT_USER_ACCCONTROLMUSER("PCUserAcccontrolmuser", "acccontrolmuser"),
  PC_KEYVAULT_PASSWORD_ACCCONTROLMUSER("PCPasswordAcccontrolmuser", "gw", "PCPasswordAcccontrolmuser", true, PC_KEYVAULT),
  PC_KEYVAULT_USER_ACCPORTALUSER("PCUserAccportaluser", "accportaluser"),
  PC_KEYVAULT_PASSWORD_ACCPORTALUSER("PCPasswordAccportaluser", "gw", "PCPasswordAccportaluser", true, PC_KEYVAULT),

  // Connection settings for ER database
  ER_DATABASE_KEYVAULT("er.database.keyvault"),
  ER_DATABASE_DBNAME("er.database.dbname", "BufferDB"),
  ER_DATABASE_HOST("er.database.hostname", "localhost"),
  ER_DATABASE_PORT("er.database.port", "1433"),
  ER_DATABASE_USERNAME("er.database.username", null),
  ER_DATABASE_PASSWORD("er.database.password", "no-default", "ERDatabasePassword", true, ER_DATABASE_KEYVAULT),

  // Properties defined for integration Address validation
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_KEYVAULT("integration.acc.service.addressvalidation.addressfinder.keyvault"),
  ADDRESSVALIDATIONAPI_SELECTEDSERVICE_SERVICENAME("integration.acc.service.addressvalidation.selectedservice.servicename", ""),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_SERVICENAME("integration.acc.service.addressvalidation.addressfinder.servicename", "AddressFinder"),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_ENDPOINT("integration.acc.service.addressvalidation.addressfinder.autocomplete.endpoint", ""),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_KEY("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.key", "", "AddressFinderAutocompleteKEY", true, ADDRESSVALIDATIONAPI_ADDRESSFINDER_KEYVAULT),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_SECRET("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.secret", "", "AddressFinderAutocompleteSECRET", true, ADDRESSVALIDATIONAPI_ADDRESSFINDER_KEYVAULT),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_DOMAIN("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.domain", ""),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_DELIVERED("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.delivered", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_POSTBOX("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.postbox", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_RURAL("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.rural", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_REGIONCODE("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.regioncode", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_STRICT("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.strict", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_MAX("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.max", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_HIGHLIGHTS("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.highlights", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_AUTOCOMPLETE_URLPARAMETERS_CALLBACK("integration.acc.service.addressvalidation.addressfinder.autocomplete.urlParameters.callback", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_KEYVAULT("integration.acc.service.addressvalidation.addressfinder.verification.keyvault"),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_ENDPOINT("integration.acc.service.addressvalidation.addressfinder.verification.endpoint", ""),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_KEY("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.key", "", "AddressFinderVerificationKEY", true, ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_KEYVAULT),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_SECRET("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.secret", "", "AddressFinderVerificationSECRET", true, ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_KEYVAULT),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_DOMAIN("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.domain", ""),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_DELIVERED("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.delivered", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_POSTBOX("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.postbox", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_RURAL("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.rural", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_REGIONCODE("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.regioncode", null),
  ADDRESSVALIDATIONAPI_ADDRESSFINDER_VERIFICATION_URLPARAMETERS_CALLBACK("integration.acc.service.addressvalidation.addressfinder.verification.urlParameters.callback", null),

  // HTTP connection pool settings. Used by IR integration / validation API clients
  HTTP_CONNECTIONPOOL_POOLSIZE("integration.acc.http.connectionpool.poolsize", "8"),
  HTTP_CONNECTIONPOOL_TIMEOUT("integration.acc.http.connectionpool.timeout", "5"),

  // Hikari JDBC connection pool properties
  HIKARI_CONNECTION_POOL_SIZE("hikari.poolsize", "10"),

  // Document Content Source
  DMS_OAUTH_KEYVAULT("dms.oauth.keyvault"),
  DMS_OAUTH_AUTHORIZATION_DOMAIN("dms.oauth.authorization.domain", "login.windows.net"),
  DMS_OAUTH_TENANT_ID("dms.oauth.tenantId", "8506768f-a7d1-475b-901c-fc1c222f496a"),
  DMS_OAUTH_RESOURCE_URI("dms.oauth.resourceUri", "https://accnz.sharepoint.com/"),
  DMS_OAUTH_CLIENT_ID("dms.oauth.clientId", null),
  DMS_OAUTH_USERNAME("dms.oauth.username", null),
  DMS_OAUTH_PASSWORD("dms.oauth.password", "no-default", "DMSOauthPassword", true, DMS_OAUTH_KEYVAULT),

  DMS_SHAREPOINT_SITE_COLLECTION_API_URL("dms.sharepoint.site.collection.api.url", ""),
  // This is the folder for Guidewire applications to store document in. The value should be the Server Relative Path
  DMS_SHAREPOINT_GUIDEWIRE_FOLDERPATH("dms.sharepoint.guidewire.folderpath", "Shared Documents/Guidewire"),
  DMS_SHAREPOINT_GUIDEWIRE_AEP_SUBFOLDER("dms.sharepoint.guidewire.aep.subfolder", "AEP"),
  DMS_SOURCE("dms.source", "PC"),

  //BIC Code address pattern
  BUSINESS_CLASSIFICATION_CODE_ADDRESS_PATTERN("business.classification.code.address.pattern"),

  // API Management Endpoints
  API_MGMT_URL_ENABLED("api.management.url.enabled", Boolean.TRUE.toString()),
  API_MGMT_URL_BASE("api.management.url.base", null),
  API_MGMT_URL_ENDPOINT_ACCOUNTS("api.management.url.endpoint.accounts", "/accounts"),
  API_MGMT_URL_ENDPOINT_CONTACTS("api.management.url.endpoint.contacts", "/contacts"),
  API_MGMT_URL_ENDPOINT_CONTACTPRIMARYADDRESS("api.management.url.endpoint.contacts.primaryaddress", "${API_MGMT_URL_ENDPOINT_CONTACTS.PropertyValue}/%s/primaryaddresses"),
  API_MGMT_URL_ENDPOINT_CONTACTACCREDITATIONS("api.management.url.endpoint.contacts.accreditations", "${API_MGMT_URL_ENDPOINT_CONTACTS.PropertyValue}/%s/accreditations"),
  API_MGMT_URL_ENDPOINT_USERS("api.management.url.endpoint.users", "/users"),
  API_MGMT_URL_ENDPOINT_USERCONTACT("api.management.url.endpoint.usercontact", "${API_MGMT_URL_ENDPOINT_USERS.PropertyValue}/%s/usercontact"),
  API_MGMT_URL_ENDPOINT_ACCOUNTCONTACTS("api.management.url.endpoint.accountcontacts", "${API_MGMT_URL_ENDPOINT_ACCOUNTS.PropertyValue}/%s/accountcontacts"),
  API_MGMT_URL_ENDPOINT_ACCOUNTCONTACTROLES("api.management.url.endpoint.accountcontactroles", "${API_MGMT_URL_ENDPOINT_ACCOUNTCONTACTS.PropertyValue}/%s/contacts/%s/roles"),
  API_MGMT_URL_ENDPOINT_ACCOUNTUSERROLEASSIGNMENTS("api.management.url.endpoint.accountuserroleassignments", "${API_MGMT_URL_ENDPOINT_ACCOUNTS.PropertyValue}/%s/userroleassignments"),
  API_MGMT_URL_ENDPOINT_ACCOUNTNOTES("api.management.url.endpoint.accountnotes", "${API_MGMT_URL_ENDPOINT_ACCOUNTS.PropertyValue}/%s/notes"),
  API_MGMT_SUBSCRIPTION_KEY("api.management.subscription.key"),

  //MYA4B Email Verification Endpoint
  MYA4B_EMAIL_VERIFICATION("integration.acc.mya4bemailverification", "https://business-test.ds.acc.co.nz/staff/levypayer/view/{accNumber}"),

  /**
   * Defines the socket timeout (SO_TIMEOUT) in milliseconds, which is the timeout for waiting for data or, put differently, a maximum period inactivity between two consecutive data packets).
   * A timeout value of zero is interpreted as an infinite timeout.
   */
  API_MGMT_SOCKET_TIMEOUT("api.management.socket.timeout", "10000"),

  /**
   * Determines the timeout in milliseconds until a connection is established. A timeout value of zero is interpreted as an infinite timeout.
   * A timeout value of zero is interpreted as an infinite timeout.
   */
  API_MGMT_CONNECTION_TIMEOUT("api.management.connection.timeout", "10000"),

  // API Management OAuth 2.0 properties
  API_MGMT_KEYVAULT("api.management.keyvault"),
  API_MGMT_OAUTH2_AUTH_URI_BASE("api.management.oauth2.auth.uri.base", "https://login.windows.net"),
  API_MGMT_OAUTH2_RESOURCE_URI("api.management.oauth2.resource.uri"),
  API_MGMT_OAUTH2_CLIENTID("api.management.oauth2.clientid"),
  API_MGMT_OAUTH2_CLIENTSECRET("api.management.oauth2.clientsecret", "no-default", "APIManagementClientSecret", true, API_MGMT_KEYVAULT),
  API_MGMT_OAUTH2_TENANTID("api.management.oauth2.tenantid"),

  // GNA properties for processing Inbound files
  INDIVIDUAL_ACC("integration.inbound.gna.IndividualACC", "IndividualACC"),
  INDIVIDUAL_CPX("integration.inbound.gna.IndividualCPX", "IndividualCPX"),
  EMPLOYER_ACC("integration.inbound.gna.EmployerACC", "EmployerACC"),
  SHAREHOLDING_COMPANY("integration.inbound.gna.ShareholdingCompany", "ShareholdingCompany"),
  ACCREDITED_EMPLOYERS_PROGRAMME("integration.inbound.gna.AccreditedEmployersProgramme", "AccreditedEmployersProgramme"),

  //outbound folder
  OUTBOUND_PROCESS_FOLDER("integration.acc.folders.outbound.inprogress", "tmp/pc/outbound/processing"),
  OUTBOUND_ERROR_FOLDER("integration.acc.folders.outbound.error", "tmp/pc/outbound/error"),
  OUTBOUND_DONE_MAILHOUSE2_FOLDER("integration.acc.folders.outbound.done.mailhouse2", "tmp/pc/outbound/mailhouse2"),

  INBOUND_INSTRUCTIONS_FOLDER("integration.acc.folders.instruction-file", "/tmp/instruction-file"),

  // IRD bulk email integration
  INBOUND_IR_BULKEMAIL_ERROR_FOLDER("integration.ir.folders.bulkemail.inbound.error", "/tmp/pc/irbulkemail/error"),

  // IR inbound file integration
  INBOUND_IR_FILES_FOLDER("integration.ir.folders.irfiles", "/tmp/pc/irfiles"),

  //Shareholder pattern
  SHAREHOLDER_IS_COMPANY_PATTERN("shareholder.is.company.pattern"),

  // Juno Information Service
  JIS_ENABLED("integration.jis.enabled", "false"),
  JIS_KEYVAULT("integration.jis.keyvault"),
  JIS_EVENTHUB_CONNECTIONSTRING("integration.jis.eventhub.connectionstring", "", "EventHubConnectionStringSend", true, JIS_KEYVAULT),

  // NZBN Event Hub
  NZBN_EVENTHUB_ENABLED("integration.nzbn.eventhub.enabled", "false"),
  NZBN_EVENTHUB_KEYVAULT("integration.nzbn.eventhub.keyvault"),
  NZBN_EVENTHUB_NAMESPACENAME("integration.nzbn.eventhub.namespacename", ""),
  NZBN_EVENTHUB_EVENTHUBNAME("integration.nzbn.eventhub.eventhubname", ""),
  NZBN_EVENTHUB_SAS_KEYNAME("integration.nzbn.eventhub.sas.keyname", ""),
  NZBN_EVENTHUB_SAS_KEY("integration.nzbn.eventhub.sas.key", "", "NzbnEventHubSasKey", true, NZBN_EVENTHUB_KEYVAULT),
  NZBN_EVENTHUB_STORAGE_CONNECTIONSTRING("integration.nzbn.eventhub.storage.connectionstring", "", "NzbnEventHubStorageConnectionString", true, NZBN_EVENTHUB_KEYVAULT),
  NZBN_EVENTHUB_STORAGE_CONTAINERNAME("integration.nzbn.eventhub.storage.containername", ""),
  NZBN_EVENTHUB_CONSUMERGROUP("integration.nzbn.eventhub.consumergroup", ""),
  NZBN_EVENTHUB_CHECKPOINT_INTERVAL("integration.nzbn.eventhub.checkpoint-interval", ""),

  // NZBN Validation API
  NZBN_VALIDATIONAPI_ENABLED("integration.nzbn.validationapi.enabled", "false"),
  NZBN_VALIDATIONAPI_KEYVAULT("integration.nzbn.validationapi.keyvault"),
  NZBN_VALIDATIONAPI_APPID("integration.nzbn.validationapi.appid", "", "NzbnValidationApiAppId", true, NZBN_VALIDATIONAPI_KEYVAULT),
  NZBN_VALIDATIONAPI_HOST("integration.nzbn.validationapi.host"),
  NZBN_VALIDATIONAPI_PATH("integration.nzbn.validationapi.path"),

  // Secure Messaging
  SECUREMESSAGING_SERVICE_ENABLED("integration.securemessaging.enabled", "false"),
  SECUREMESSAGING_SERVICE_APIM_BASEPATH("integration.securemessaging.apim.basepath"),
  SECUREMESSAGING_SERVICE_APIM_FORWARD_HOST("integration.securemessaging.apim.header.host"),
  SECUREMESSAGING_SERVICE_APIM_SUBSCRIPTION_KEY("integration.securemessaging.apim.header.subscription-key", "", "SecureMessagingAPIMKey", true, PC_KEYVAULT),

  // Mailhouse
  MAILHOUSE_INBOUND_DIRECTORY("integration.mailhouse.dir.inbound"),
  MAILHOUSE_PROCESS_DIRECTORY("integration.mailhouse.dir.process"),

  ER_ENCRYPTION_SALT("er.encryption.salt", "UGV0ZXIgR2FsYW4=", "EREncrytionSalt", true, PC_KEYVAULT)
  //====================================================================================================================

  var _configLoader = ConfigurationPropertyLoader.Singleton

  final var _propertyName : String as readonly PropertyName
  final var _defaultValue : String as readonly DefaultValue
  final var _secretName : String as readonly SecretName
  final var _keyVaultName : ConfigurationProperty as readonly KeyVaultName
  final var _secure : Boolean as readonly Secure

  private construct(propertyName : String, defaultValue : String = null, secretName : String = null, isSecure : Boolean = false, keyVaultName : ConfigurationProperty = null) {
    this._propertyName = propertyName
    this._defaultValue = defaultValue
    this._secretName = secretName
    this._keyVaultName = keyVaultName
    this._secure = isSecure
  }

  /**
   * Value of the property.
   *
   * @return property value
   */
  property get PropertyValue() : String {
    return this._configLoader.getValueFor(this)
  }

}
