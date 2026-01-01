package nz.co.acc.plm.integration.security.authentication

/**
 * Created by fabianr on 10/03/2017.
 */
class OAuth2Exception extends Exception {
  construct(message: String) {
    super(message)
  }
  construct(message: String, cause: Throwable) {
    super(message, cause)
  }

}