package nz.co.acc.integration.ir.record.handler

uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.ir.exec.handler.actions.customerupdate.CustomerUpdateActions
uses nz.co.acc.integration.ir.record.CREGRecord

/**
 * Processes CREG1 / Customer Registration records from IR
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class CREGHandler {

  function processRecord(bundle : Bundle, record: CREGRecord) {

    new CustomerUpdateActions(record).createAccountAndPolicy(bundle)
  }
}