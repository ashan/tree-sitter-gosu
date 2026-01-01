package nz.co.acc.common.integration.files.outbound.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.entity.IEntityType
uses gw.pl.currency.MonetaryAmount

uses java.io.Serializable
uses java.math.BigDecimal

/**
 * Created by ChavezD on 1/02/2017.
 * Class for Pending OutBoundRecord search
 */

@Export
class PendingOutboundRecordSearchCriteria_ACC implements Serializable {

  final static var SHOULD_IGNORE_CASE = true

  var _accountNumber: String as AccountNumber
  var _RecordStatus: OutBoundRecordStatus_ACC as RecordStatus
  var _RecordType: OutBoundRecordType_ACC as RecordType
  var _minAmount: MonetaryAmount as MinAmount
  var _maxAmount: MonetaryAmount as MaxAmount
  var _earliestDate: Date as EarliestDate
  var _latestDate: Date as LatestDate

  static function getListRecordStatus(): void {
  }

  /**
   * Search function for Searching Outbound pending records
   *
   * @return
   */
  function performSearch(): IQueryBeanResult<OutBoundRecord_ACC> {
    checkForDateExceptions(EarliestDate, LatestDate);
    checkForNumericExceptions(MinAmount, MaxAmount);
    var query = buildQuery() as Query<OutBoundRecord_ACC>
    return query.select()
  }

  /**
   * query building for Outbound pending records
   *
   * @return
   */
  function buildQuery(): Query {
    var query = Query.make(OutBoundRecord_ACC)
    restricSearchByStatus(query)
    restricSearchByType(query)
    restrictSearchByNoHeader(query)
    restrictSearchByAccountNumber(query)
    restrictSearchByMinAndMaxAmount(query)
    restrictSearchByDate(query)
    return query
  }

  /**
   * adding restriction to query for Outbound pending records
   *
   * @param query
   */
  private function restricSearchByType(query: Query<OutBoundRecord_ACC>): void {
    if (RecordType != null) {
      query.compare(OutBoundRecord_ACC#Type, Relop.Equals, RecordType)
    }
  }

  /**
   * adding restriction to query for Outbound pending records
   *
   * @param query
   */
  private function restricSearchByStatus(query: Query<OutBoundRecord_ACC>) {
    if (RecordStatus != null) {
      query.compare(OutBoundRecord_ACC#Status, Relop.Equals, RecordStatus)
    }
  }

  /**
   * adding restriction to query for Outbound pending records
   *
   * @param query
   */
  private function restrictSearchByNoHeader(query: Query<OutBoundRecord_ACC>): void {
    query.compare(OutBoundRecord_ACC#Header, Relop.Equals, null)
  }

  private function getStatus(): IEntityType {
    return RecordStatus.getEntityType()
  }

  /**
   * adding restriction to query for Outbound pending records
   *
   * @param query
   */
  function restrictSearchByAccountNumber(query: Query) {
    if (AccountNumber.NotBlank) {
      query.startsWith(OutBoundRecord_ACC#AccountNumber, AccountNumber, SHOULD_IGNORE_CASE)
    }
  }

  /**
   * adding restriction to query for Outbound pending records
   *
   * @param query
   */
  function restrictSearchByMinAndMaxAmount(query: Query) {
    if (MinAmount != null || MaxAmount != null) {
      query.between(OutBoundRecord_ACC#Amount, MinAmount, MaxAmount)
    }
  }

  /**
   * adding restriction to query for Outbound pending records
   *
   * @param query
   */
  function restrictSearchByDate(query: Query) {
    if (EarliestDate != null || LatestDate != null) {
      var endOfLatestDate = LatestDate != null ? DateUtil.endOfDay(LatestDate) : LatestDate
      query.between(OutBoundRecord_ACC#CreateTime, EarliestDate, endOfLatestDate);
    }
  }

  function checkForNumericExceptions(min : BigDecimal, max : BigDecimal) {
    if ((min != null && max == null) || (min == null && max != null)) {
      throw new DisplayableException(DisplayKey.get("Web.Error.MustSpecifyBothMinAndMax"));
    }
    if (min != null && max.compareTo(min) < 0) {
      throw new DisplayableException(DisplayKey.get("Web.Error.MaxAmountLessThanMinAmount"));
    }
  }

  function checkForDateExceptions(earlierDate : Date, laterDate : Date) {
    if (earlierDate != null && laterDate != null && laterDate.before(earlierDate)) {
      throw new DisplayableException(DisplayKey.get("Web.Error.LaterDateBeforeEarlierDate"));
    }
  }
}