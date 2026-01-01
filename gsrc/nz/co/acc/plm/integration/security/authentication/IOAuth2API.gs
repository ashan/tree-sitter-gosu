package nz.co.acc.plm.integration.security.authentication

/**
 * Created by fabianr on 28/02/2017.
 */
interface IOAuth2API {

  public function getAccessToken(accessCode: String) : String
  public function getUserPrincipal(accessToken: String) : String

}