package nz.co.acc.common.edge.servlet

uses com.guidewire.pl.system.service.context.ServiceToken
uses edge.servlet.DocumentDownloadServlet
uses gw.api.webservice.login.LoginAPIHelper
uses gw.servlet.Servlet
uses gw.util.StreamUtil
uses nz.co.acc.common.edge.CommonServletFunctions
uses nz.co.acc.plm.integration.security.authentication.KeyVaultAuthenticationSource
uses nz.co.acc.plm.integration.security.authentication.KeyVaultAzureAPI
uses nz.co.acc.plm.integration.security.authentication.KeyVaultException
uses org.apache.commons.codec.binary.Base64
uses org.slf4j.LoggerFactory

uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse

/**
 * Created by KasthuA on 7/06/2017.
 */
@Servlet(\path : String -> path.matches("/edge/document(/.*)?"))
class DocumentDownloadServlet_ACC extends DocumentDownloadServlet {

  private var _edgeLogger = LoggerFactory.getLogger("Edge")

  protected override function service(req : HttpServletRequest, resp : HttpServletResponse) {
    var commonServletFunctions = new CommonServletFunctions()
    var params = commonServletFunctions.handlePreService({CommonServletFunctions.REQUEST->req, CommonServletFunctions.RESPONSE->resp})

    // Service the request
    try {
      super.service(params.get(CommonServletFunctions.REQUEST) as HttpServletRequest, params.get(CommonServletFunctions.RESPONSE) as HttpServletResponse)
    } finally {
      // Log the response
      commonServletFunctions.handlePostService(params)
    }
  }

  override function authenticate(req : HttpServletRequest) : String {
    var retValue : String = null
    var authHeader = req.getHeader("authorization")
    if (authHeader != null) {
      if (authHeader.toLowerCase().startsWith("basic ")) {
        // We can deal with basic...
        // XXX: Note: we assume current locale encoding
        var fullAuth = StreamUtil.toString(Base64.decodeBase64(authHeader.substring(6)))
        var unamePasswd = fullAuth.split(":")
        try {

          if (KeyVaultAzureAPI.isEnabled()) {
            //using KeyVault exception handling
            try {
              var authSource = new KeyVaultAuthenticationSource(unamePasswd[0], unamePasswd[1])
              if (authSource.isAuthenticated) {
                var user = KeyVaultAzureAPI.keyVaultAuthentication(authSource)
                var token : ServiceToken = KeyVaultAzureAPI.createServiceToken(user)
                return token.getSessionID()
              } else {
                throw new KeyVaultException(KeyVaultAzureAPI.ERROR_ACCESS_DENIED)
              }
            } catch (exception : Exception) {
              throw new KeyVaultException(KeyVaultAzureAPI.ERROR_ACCESS_DENIED)
            }
          } else {
            retValue = LoginAPIHelper.login(unamePasswd[0], unamePasswd[1])
          }
        } catch (e : Throwable) {
          _edgeLogger.debug(e.toString())
          retValue = null
        }
      }
    }

    return retValue
  }
}