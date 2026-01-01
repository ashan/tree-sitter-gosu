package edge.samlV2.authplugins

uses gw.plugin.security.AuthenticationSource
uses com.guidewire.pl.system.dependency.PLDependencies
uses edge.samlV2.util.SAMLProcessor
uses org.opensaml.saml2.core.StatusCode
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger

class SAMLAuthenticationSource implements AuthenticationSource {

  final private static var _logger = new Logger(Reflection.getRelativeName(SAMLAuthenticationSource))

  private var processor = new SAMLProcessor()
  private var user:String as Username = null
  private var pid:String as PublicID = null
  private var assertionId:String = null
  private var assertionVerified:Boolean as Authenticated = Boolean.FALSE


  public construct(inbound:String) {
    var resp = processor.readResponse(inbound)
    processor.validateSignature(resp)
    _logger.logInfo(resp.Status.StatusCode.Value)
    if(resp.Status.StatusCode.Value == StatusCode.SUCCESS_URI) {
      var assertion = resp.Assertions.first()
      user = assertion.Subject.NameID.Value
      _logger.logInfo(user)

      var t = PLDependencies.getUserFinder().findByCredentialName(user)
      pid = t.PublicID
      _logger.logInfo(pid)
      assertionVerified = Boolean.TRUE
    }
  }

  override property get Hash(): char[] {
    return assertionId.toCharArray()
  }

  override function determineSourceComplete(): boolean {
    return true
  }
}
