package nz.co.acc.plm.integration.ir.schedule

/**
 * For the checked exceptions related to the IR Schedule.
 */
class IRScheduleException extends Exception {

  construct(message: String) {
    super(message)
  }

  construct(message: String, cause: Throwable) {
    super(message, cause)
  }
}