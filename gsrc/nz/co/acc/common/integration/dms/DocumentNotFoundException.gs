package nz.co.acc.common.integration.dms

/**
 * This exception should be thrown when an operation on a document fails because the document could not be found.
 * This can happen if the document does not exist on DMS anymore.
 * <p>
 * Created by Nick Mei on 16/02/2017.
 */
class DocumentNotFoundException extends Exception {

  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }

}