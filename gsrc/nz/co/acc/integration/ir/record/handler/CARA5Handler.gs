package nz.co.acc.integration.ir.record.handler

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.integration.ir.record.CARA5Record
uses nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate.ShareholderUpdateAction

/**
 * Processes CARA5 / Shareholder Earnings records
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CARA5Handler {

  public function processRecordSet(bundle : Bundle, account : Account, records : Set<CARA5Record>) {

    new ShareholderUpdateAction(records).processEarnings(account, bundle)
  }
}