package edge.samlV2.idp

uses javax.servlet.http.HttpServletRequest
uses edge.samlV2.util.SAMLProcessor
uses java.lang.Exception

/**
 *  Object to encapsulate request parameters and values extracted from the actual authn request

 */
public class SAMLRequestParameters {

  private var _username:String as Username = null
  private var _password:String as Password = null
  private var _samlAction:String as Action = null
  private var _samlReturnPage:String as ReturnPage = null
  private var _samlRelayStateURL:String as RelayStateURL = null
  private var _issueInstant:String as IssueInstant = null
  private var _providerName:String as ProviderName = null
  private var _acsUrlName:String as ACSUrl = null
  private var _requestId:String as RequestID = null
  private var _validRequest:Boolean as ValidRequest = Boolean.FALSE
  private var _issuer:String as Issuer = null
  private var _samlProcessor = new SAMLProcessor()

  public construct(req:HttpServletRequest) {
    _username = req.getParameter(SAML.USERNAME)
    _password = req.getParameter(SAML.PASSWORD)
    _samlAction = req.getParameter(SAML.ACTION)
    _samlReturnPage = req.getParameter(SAML.RETURNPAGE)
    _samlRelayStateURL = req.getParameter(SAML.RELAYSTATE)
    try {
      var samlRequest = _samlProcessor.readRequest(req.getParameter(SAML.REQUEST))
      _issueInstant = samlRequest.IssueInstant.toString()
      _providerName = samlRequest.ProviderName
      _acsUrlName = samlRequest.AssertionConsumerServiceURL // May need to capture the index
      _requestId = samlRequest.ID
      _issuer = samlRequest.Issuer.Value
      _validRequest = _requestId.NotBlank ? Boolean.TRUE : Boolean.FALSE
      } catch(e:Exception) {
        SAMLV2IdP.logger.error(e.toString())
      }
    }
}
