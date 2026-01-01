package edge.samlV2.idp

uses java.lang.Integer

/**
 * Constants used in processing SAML requests - Some of these need to be rationalized (RelatyState + relayStateURL, et al)
 *
 */
interface SAML {
  public static final var ACTION:String = "samlAction"
  public static final var REQUEST:String = "SAMLRequest"
  public static final var USERNAME:String = "samlusername"
  public static final var PASSWORD:String = "samlpassword"
  public static final var RELAYSTATE:String = "RelayState"
  public static final var RETURNPAGE:String = "returnPage"
  public static final var ISSUE_INSTANT:String = "issueInstant"
  public static final var PROVIDER_NAME:String = "providerName"
  public static final var ACSURL:String = "acsURL"
  public static final var REQUESTID:String = "requestId"
  public static final var DOMAINNAME:String = "domainName"
  public static final var RELAY_STATE_URL:String = "relayStateURL"
  public static final var RESPONSE:String = "samlResponse"
  public static final var RESPONSE_ID:String = "ResponseID"
  public static final var ID:String = "ID"
}
