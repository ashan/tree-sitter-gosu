package nz.co.acc.common.integration.security

/**
 * This exception is used by OAuthAPI when an error occurs, this exception should be thrown.
 *
 * Created by Nick on 22/05/2017.
 */
class OAuthException extends Exception {

  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }

}