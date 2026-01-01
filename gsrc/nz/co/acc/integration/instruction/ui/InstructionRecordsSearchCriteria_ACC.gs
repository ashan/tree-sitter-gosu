package nz.co.acc.integration.instruction.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException

uses java.io.Serializable

/**
 * Created by Rajasekar Balasubramaniyan on 24/02/2021.
 * Based on InstructionRecordSearchCriteria_ACC
 * Searching for Instruction records
 */
class InstructionRecordsSearchCriteria_ACC implements Serializable {
  var _accountNumber : String as AccountNumber
  var _RecordStatus : InstructionRecordStatus_ACC as RecordStatus
  var _RecordType : InstructionType_ACC as RecordType
  var _earliestDate : Date as EarliestDate
  var _latestDate : Date as LatestDate

  /**
   * Search function for Searching Instruction records
   *
   * @return
   */
  function performSearch() : IQueryBeanResult<InstructionRecord_ACC> {
    checkForDateExceptions(EarliestDate, LatestDate);
    var query = buildQuery() as Query<InstructionRecord_ACC>
    return query.select()
  }

  /**
   * query building for Instruction records
   *
   * @return
   */
  function buildQuery() : Query {
    var query = Query.make(InstructionRecord_ACC)
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
  private function restricSearchByType(query : Query<InstructionRecord_ACC>) : void {
    if (RecordType != null) {
      query.compare(InstructionRecord_ACC#InstructionType_ACC, Relop.Equals, RecordType)
    }
  }

  /**
   * adding status restriction to query
   *
   * @param query
   */
  private function restricSearchByStatus(query : Query<InstructionRecord_ACC>) {
    if (RecordStatus != null) {
      query.compare(InstructionRecord_ACC#Status, Relop.Equals, RecordStatus)
    }
  }

  /**
   * adding account number restriction to query
   *
   * @param query
   */
  function restrictSearchByAccountNumber(query : Query) {
    if (AccountNumber.NotBlank) {
      query.compare(InstructionRecord_ACC#ACCID, Relop.Equals, AccountNumber)
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
      query.between(InstructionRecord_ACC#CreateTime, EarliestDate, endOfLatestDate);
    }
  }

  function checkForDateExceptions(earlierDate : Date, laterDate : Date) {
    if (earlierDate != null && laterDate != null && laterDate.before(earlierDate)) {
      throw new DisplayableException(DisplayKey.get("Web.Error.LaterDateBeforeEarlierDate"));
    }
  }
}