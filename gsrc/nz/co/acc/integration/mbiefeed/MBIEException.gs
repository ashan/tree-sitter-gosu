package nz.co.acc.integration.mbiefeed

/**
 * Created by Mike Ourednik on 27/08/20.
 */
class MBIEException extends RuntimeException {
  construct(msg: String) {
    super(msg)
  }

  construct(msg: String, error: Exception) {
    super(msg, error)
  }
}