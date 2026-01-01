package nz.co.acc.common.integration.bulkupload.error

/**
 * An error when parsing a CSV field
 * Created by OurednM on 14/06/2018.
 */
class FieldValidationError extends Exception {
  construct(message: String) {
    super(message)
  }
}