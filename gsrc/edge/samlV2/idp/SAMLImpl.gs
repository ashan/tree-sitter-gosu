package edge.samlV2.idp
uses java.io.FileInputStream
uses java.util.Properties
uses gw.api.util.ConfigAccess

class SAMLImpl implements SAML{
  
  private static var DEFAULT_SSOCONFIG_FILE : String = "config/samlsso.properties"
  private static var props = loadProperties()
  
  /**
   * SAML Properties that will be loaded from properties file
   */
  public static var IDP_RSAPUBLICKEY_LOCATION : String = props.getProperty("pc.idp.rsapublickey")
  public static var IDP_RSAPRIVATEKEY_LOCATION : String = props.getProperty("pc.idp.rsaprivatekey")
  public static var IDP_ENTITYID : String = props.getProperty("pc.idp.entityid")
  public static var SET_SAML_RESPONSEID : boolean = props.getProperty("pc.idp.setresponseid").toBoolean()
  public static var AUDIENCEURI : String = props.getProperty("pc.saml.audienceuri")
  public static var SESSION_EXPIRY_HOURS : int = props.getProperty("pc.saml.sessionexpiryhours").toInt()
  public static var SESSION_COOKIE_DOMAIN : String = props.getProperty("pc.sessioncookie.domain")
  public static var SESSION_COOKIE_PATH : String = props.getProperty("pc.sessioncookie.path")
  
  /**
   * String key to retrieve tokens maintained in the application store
   */
  public static final var SESSION_KEY:String = props.getProperty("pc.saml.sessionkey")
  public static final var SESSION_PURGE_HEADER:String = props.getProperty("pc.saml.sessionpurgeheader")
  
  private static function loadProperties(): Properties{
    var _properties = new Properties()
    using(var is = new FileInputStream(ConfigAccess.getConfigFile(DEFAULT_SSOCONFIG_FILE))){
      _properties.load(is)      
    }
    return _properties      
  }

}
