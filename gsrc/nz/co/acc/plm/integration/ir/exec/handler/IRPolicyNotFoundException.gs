package nz.co.acc.plm.integration.ir.exec.handler

uses gw.api.util.DisplayableException

/**
 * Exception thrown when attempting to update earnings for a policy line that doesn't exist on the account.
 */
class IRPolicyNotFoundException extends DisplayableException {

  public construct(message : String) {
    super(message)
  }

}