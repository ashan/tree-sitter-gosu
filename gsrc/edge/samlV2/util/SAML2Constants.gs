package edge.samlV2.util

final class SAML2Constants {
  
  /**
   * Name ID Format
   */
  public static final var NAMEID_FORMAT_UNSPECIFIED : String = "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"
  public static final var NAMEID_FORMAT_EMAIL_ADDRESS : String = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  public static final var NAMEID_FORMAT_X509_SUBJECT_NAME : String = "urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName"
  public static final var NAMEID_FORMAT_WINDOWS_DQN : String = "urn:oasis:names:tc:SAML:1.1:nameid-format:WindowsDomainQualifiedName"
  public static final var NAMEID_FORMAT_KERBEROS : String = "urn:oasis:names:tc:SAML:2.0:nameid-format:kerberos"
  public static final var NAMEID_FORMAT_ENTITY : String = "urn:oasis:names:tc:SAML:2.0:nameid-format:entity"
  public static final var NAMEID_FORMAT_PERSISTENT : String = "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
  public static final var NAMEID_FORMAT_TRANSIENT : String = "urn:oasis:names:tc:SAML:2.0:nameid-format:transient"
  
  
  /**
   * Subject Confirmation
   */
  public static final var CONF_BEARER : String = "urn:oasis:names:tc:SAML:2.0:cm:bearer"  
  public static final var CONF_HOLDER_KEY : String = "urn:oasis:names:tc:SAML:2.0:cm:holder-of-key"  
  public static final var CONF_SENDER_VOUCHES : String = "urn:oasis:names:tc:SAML:2.0:cm:sender-vouches"  
  
  /**
   * Auth Context Class Ref
   */
  public static final var AUTH_CONTEXT_CLASS_REF_INTERNET_PROTOCOL : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocol"
  public static final var AUTH_CONTEXT_CLASS_REF_INTERNET_PROTOCOL_PASSWORD : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:InternetProtocolPassword"
  public static final var AUTH_CONTEXT_CLASS_REF_KERBEROS : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:Kerberos"
  public static final var AUTH_CONTEXT_CLASS_REF_MOBILE_ONE_FACTOR_UNREGISTERED : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileOneFactorUnregistered"
  public static final var AUTH_CONTEXT_CLASS_REF_MOBILE_TWO_FACTOR_UNREGISTERED : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorUnregistered"
  public static final var AUTH_CONTEXT_CLASS_REF_MOBILE_ONE_FACTOR_CONTRACT : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileOneFactorContract"
  public static final var AUTH_CONTEXT_CLASS_REF_MOBILE_TWO_FACTOR_CONTRACT : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:MobileTwoFactorContract"
  public static final var AUTH_CONTEXT_CLASS_REF_PASSWORD : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:Password"
  public static final var AUTH_CONTEXT_CLASS_REF_PASSWORD_PROTECTED_TRANSPORT : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"
  public static final var AUTH_CONTEXT_CLASS_REF_PREVIOUS_SESSION : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:PreviousSession"
  public static final var AUTH_CONTEXT_CLASS_REF_X509 : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:X509"
  public static final var AUTH_CONTEXT_CLASS_REF_PGP : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:PGP"
  public static final var AUTH_CONTEXT_CLASS_REF_SPKI : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:SPKI"
  public static final var AUTH_CONTEXT_CLASS_REF_XMLDSIG : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:XMLDSig"
  public static final var AUTH_CONTEXT_CLASS_REF_SMARTCARD : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:Smartcard"
  public static final var AUTH_CONTEXT_CLASS_REF_SMARTCARD_PKI : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:SmartcardPKI"
  public static final var AUTH_CONTEXT_CLASS_REF_SOFTWARE_PKI : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:SoftwarePKI"
  public static final var AUTH_CONTEXT_CLASS_REF_TELEPHONY : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:Telephony"
  public static final var AUTH_CONTEXT_CLASS_REF_NOMAD_TELEPHONY : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:NomadTelephony"
  public static final var AUTH_CONTEXT_CLASS_REF_PERSONAL_TELEPHONY : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:PersonalTelephony"
  public static final var AUTH_CONTEXT_CLASS_REF_AUTHENTICATED_TELEPHONY : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:AuthenticatedTelephony"
  public static final var AUTH_CONTEXT_CLASS_REF_SECURED_REMOTE_PASSWORD : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:SecureRemotePassword"
  public static final var AUTH_CONTEXT_CLASS_REF_TLS_CLIENT : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:TLSClient"
  public static final var AUTH_CONTEXT_CLASS_REF_TIME_SYNC_TOKEN : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:TimeSyncToken"
  public static final var AUTH_CONTEXT_CLASS_REF_UNSPECIFIED : String = "urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified"
  
  /**
   * Attribute Name Format
   */
  public static final var ATTRNAME_FORMAT_UNSPECIFIED : String = "urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified"
  public static final var ATTRNAME_FORMAT_URI : String = "urn:oasis:names:tc:SAML:2.0:attrname-format:uri"
  public static final var ATTRNAME_FORMAT_BASIC : String = "urn:oasis:names:tc:SAML:2.0:attrname-format:basic"
  
  private construct(){}

}
