package nz.co.acc.plm.integration.irbulk.inbound.email

/**
 * Created by samarak on 30/11/2017.
 */
class InvalidBulkEmailRecordException extends Exception {

  construct(message: String) {
    super("Unparseable ir bulk email address found - ${message}")
  }
}