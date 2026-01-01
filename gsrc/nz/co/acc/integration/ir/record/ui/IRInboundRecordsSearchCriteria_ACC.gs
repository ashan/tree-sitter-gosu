package nz.co.acc.integration.ir.record.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException

uses java.io.Serializable

/**
 * Created by Chris Anderson on 25/02/2020.
 * Based on PendingOutboundRecordSearchCriteria_ACC
 * Searching for IR Inbound records
 */
class IRInboundRecordsSearchCriteria_ACC implements Serializable {
  var _accountNumber : String as AccountNumber
  var _RecordStatus : IRInboundRecordStatus_ACC as RecordStatus
  var _RecordType : IRExtRecordType_ACC as RecordType
  var _earliestDate : Date as EarliestDate
  var _latestDate : Date as LatestDate

  /**
   * Search function for Searching IR Inbound records
   *
   * @return
   */
  function performSearch() : IQueryBeanResult<IRInboundRecord_ACC> {
    checkForDateExceptions(EarliestDate, LatestDate);
    var query = buildQuery() as Query<IRInboundRecord_ACC>
    return query.select()
  }

  function performFailedPayloadRecordSearch(): IQueryBeanResult<IRInboundRecord_ACC> {
    checkForDateExceptions(EarliestDate, LatestDate);
    var query = Query.make(IRInboundRecord_ACC)
    restrictSearchByDate(query)
    query.compareIn(IRInboundRecord_ACC#Status,{IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD, IRInboundRecordStatus_ACC.TC_ERROR})
    return query.select()
  }

  /**
   * query building for Inbound IR Inbound records
   *
   * @return
   */
  function buildQuery() : Query {
    var query = Query.make(IRInboundRecord_ACC)
    restricSearchByStatus(query)
    restricSearchByType(query)
    restrictSearchByAccountNumber(query)
    restrictSearchByDate(query)
    return query
  }

  /**
   * adding record type restriction to query
   *
   * @param query
   */
  private function restricSearchByType(query : Query<IRInboundRecord_ACC>) : void {
    if (RecordType != null) {
      query.compare(IRInboundRecord_ACC#IRExtRecordType_ACC, Relop.Equals, RecordType)
    }
  }

  /**
   * adding status restriction to query
   *
   * @param query
   */
  private function restricSearchByStatus(query : Query<IRInboundRecord_ACC>) {
    if (RecordStatus != null) {
      query.compare(IRInboundRecord_ACC#Status, Relop.Equals, RecordStatus)
    }
  }

  /**
   * adding account number restriction to query
   *
   * @param query
   */
  function restrictSearchByAccountNumber(query : Query) {
    if (AccountNumber.NotBlank) {
      query.compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, AccountNumber)
    }
  }

  /**
   * adding date restriction to query
   *
   * @param query
   */
  function restrictSearchByDate(query : Query) {
    if (EarliestDate != null || LatestDate != null) {
      var endOfLatestDate = LatestDate != null ? DateUtil.endOfDay(LatestDate) : LatestDate
      query.between(IRInboundRecord_ACC#CreateTime, EarliestDate, endOfLatestDate);
    }
  }

  function checkForDateExceptions(earlierDate : Date, laterDate : Date) {
    if (earlierDate != null && laterDate != null && laterDate.before(earlierDate)) {
      throw new DisplayableException(DisplayKey.get("Web.Error.LaterDateBeforeEarlierDate"));
    }
  }
}