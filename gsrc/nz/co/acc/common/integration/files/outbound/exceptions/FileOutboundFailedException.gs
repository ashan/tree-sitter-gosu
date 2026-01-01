package nz.co.acc.common.integration.files.outbound.exceptions

/**
 * This exception should be used when the batch run fails.
 * Created by ChavezD on 15/02/2017.
 */
class FileOutboundFailedException extends Exception {

  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }
}