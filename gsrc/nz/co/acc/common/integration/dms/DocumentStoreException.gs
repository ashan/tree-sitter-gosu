package nz.co.acc.common.integration.dms

/**
 * Used for any Sharepoint API exceptions.
 * <p>
 * Created by Nick Mei on 16/02/2017.
 */
class DocumentStoreException extends Exception {

  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }
}