package nz.co.acc.integration.ir.record.handler

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate.SelfEmployedUpdateAction
uses nz.co.acc.integration.ir.record.CARA4Record

/**
 * Processes CARA4 / Self Employed Earnings from IR
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CARA4Handler {

  public function processRecord(bundle : Bundle, account : Account, record : CARA4Record) {

    new SelfEmployedUpdateAction(record).processEarnings(account, bundle)
  }

}