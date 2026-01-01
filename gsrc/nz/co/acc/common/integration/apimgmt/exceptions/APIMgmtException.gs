package nz.co.acc.common.integration.apimgmt.exceptions

/**
 * Exception to represent any errors occurred when communicating with the API Management. This could be a communication
 * failure or failure caused due to unexpected error returned by the API Management.
 */
class APIMgmtException extends RuntimeException {

  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }
}