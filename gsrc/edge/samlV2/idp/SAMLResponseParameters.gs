package edge.samlV2.idp

uses java.util.Random


/**
 * Class to encapsulate response parameters that are reused for various parts of the response
 */
class SAMLResponseParameters {
  private static var random = new Random()
  private static final var charMapping : char[] = {'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'}

  private var _session:String as SAMLSession = createID()
  private var _responseId:String as AssertionId = createID()
  private var _authenticated:Boolean as Authenticated = Boolean.FALSE
  private var _notBefore: org.joda.time.DateTime as NotBefore = new org.joda.time.DateTime().minusMinutes(5)
  private var _nooa: org.joda.time.DateTime as NotOnOrAfter = new org.joda.time.DateTime().plusHours(SAMLImpl.SESSION_EXPIRY_HOURS) //Configured in properties file
  private var _issueInstant: org.joda.time.DateTime as IssueInstant = new org.joda.time.DateTime()
  private var _domain:String as Domain = SAMLImpl.IDP_ENTITYID //Configured in properties file

  construct(auth:Boolean) {
    _authenticated = auth
  }

  public static function createID() : String {
    var bytes = new byte[20]
    random.nextBytes(bytes)
    var chars = new char[40]
    for (i in 0..|bytes.length) {
      var left = (bytes[i] >> 4) & 15
      var right = bytes[i] & 15
      chars[i * 2] = charMapping[left]
      chars[i * 2 + 1] = charMapping[right]
    }
    return String.valueOf(chars)
  }

}
