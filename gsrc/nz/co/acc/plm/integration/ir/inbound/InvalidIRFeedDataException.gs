package nz.co.acc.plm.integration.ir.inbound

/**
 * Created by samarak on 23/03/2017.
 */
class InvalidIRFeedDataException extends RuntimeException {
  construct(message: String) {
    super(message)
  }
}