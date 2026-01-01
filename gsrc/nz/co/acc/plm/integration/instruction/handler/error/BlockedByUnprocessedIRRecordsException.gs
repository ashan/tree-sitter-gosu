package nz.co.acc.plm.integration.instruction.handler.error

uses gw.api.util.DisplayableException

/**
 * Created by Mike Ourednik on 24/04/20.
 */
class BlockedByUnprocessedIRRecordsException extends DisplayableException {

  public construct(msg: String) {
    super(msg)
  }

}