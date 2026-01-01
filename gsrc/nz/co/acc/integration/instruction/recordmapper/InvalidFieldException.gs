package nz.co.acc.integration.instruction.recordmapper

/**
 * Created by Mike Ourednik on 17/03/21.
 */
class InvalidFieldException extends Exception {
  construct(msg : String) {
    super(msg)
  }
}