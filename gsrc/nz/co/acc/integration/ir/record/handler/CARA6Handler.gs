package nz.co.acc.integration.ir.record.handler

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate.EmployerUpdateAction
uses nz.co.acc.integration.ir.record.CARA6Record

/**
 * Processes CARA6 / Employer Earnings record
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CARA6Handler {

  public function processRecord(bundle : Bundle, account : Account, record : CARA6Record) {

    new EmployerUpdateAction(record).processEarnings(account, bundle)
  }

}