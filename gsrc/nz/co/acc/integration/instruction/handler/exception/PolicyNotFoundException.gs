package nz.co.acc.integration.instruction.handler.exception

/**
 * Created by Mike Ourednik on 21/02/2021.
 */
class PolicyNotFoundException extends Exception {
  construct(msg : String) {
    super(msg)
  }

  construct(accID: String, productCode: String, levyYear: Integer, status: PolicyPeriodStatus) {
    super("Policy period not found: accID=${accID}, productCode=${productCode}, levyYear=${levyYear}, status=${status}")
  }
}