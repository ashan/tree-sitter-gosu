package nz.co.acc.plm.integration.irbulk.inbound.nzbn

/**
 * Created by OurednM on 13/02/2018.
 */
class InvalidNZBNRecordException extends Exception {

  construct(message: String) {
    super("Unparseable IR NZBN record: ${message}")
  }
}