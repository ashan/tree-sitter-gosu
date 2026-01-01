package nz.co.acc.plm.integration.webservice.policy.exception

/**
 * Created by Mike Ourednik on 22/10/2019.
 */
class ZeroValueInvoiceException extends gw.api.webservice.exception.SOAPSenderException {

  construct(msg: String) {
    super(msg)
  }
}