package nz.co.acc.integration.ir.record.util

uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * Created by Mike Ourednik on 21/04/20.
 */
class InboundRecordStatusUtil {

  final static var BLOCKED_STATUSES : IRInboundRecordStatus_ACC[] = {
      IRInboundRecordStatus_ACC.TC_ERROR,
      IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD,
      IRInboundRecordStatus_ACC.TC_UNPROCESSED}

  /**
   * Checks if account has inbound records that are unprocessed
   *
   * @param accID
   * @return
   */
  function hasUnprocessedRecords(accID : String) : Boolean {
    return Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, accID)
        .compareIn(IRInboundRecord_ACC#Status, BLOCKED_STATUSES)
        .select()
        .getCountLimitedBy(1) > 0
  }
}