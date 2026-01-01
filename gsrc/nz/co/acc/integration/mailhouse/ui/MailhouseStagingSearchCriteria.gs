package nz.co.acc.integration.mailhouse.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException

uses java.io.Serializable

class MailhouseStagingSearchCriteria implements Serializable {
  var _accID : String as ACCID
  var _status :  MailhouseStagingStatus_ACC as Status
  var _fileType : MailhouseFileType_ACC as FileType
  var _earliestDate : Date as EarliestDate
  var _latestDate : Date as LatestDate

  function performSearch() : IQueryBeanResult<MailhouseStaging_ACC> {
    checkForDateExceptions(EarliestDate, LatestDate);
    var query = buildQuery() as Query<MailhouseStaging_ACC>
    return query.select()
  }

  function buildQuery() : Query {
    var query = Query.make(MailhouseStaging_ACC)
    restrictSearchByAccountNumber(query)
    restrictSearchByDate(query)
    restricSearchByStatus(query)
    restricSearchByFileType(query)
    return query
  }

  private function restricSearchByStatus(query : Query<MailhouseStaging_ACC>) {
    if (Status != null) {
      query.compare(MailhouseStaging_ACC#Status, Relop.Equals, Status)
    }
  }

  private function restricSearchByFileType(query : Query<MailhouseStaging_ACC>) {
    if (FileType != null) {
      query.compare(MailhouseStaging_ACC#FileType, Relop.Equals, FileType)
    }
  }

  function restrictSearchByAccountNumber(query : Query) {
    if (ACCID.NotBlank) {
      query.compare(MailhouseStaging_ACC#ACCAccountID, Relop.Equals, ACCID)
    }
  }

  function restrictSearchByDate(query : Query) {
    if (EarliestDate != null || LatestDate != null) {
      var endOfLatestDate = LatestDate != null ? DateUtil.endOfDay(LatestDate) : LatestDate
      query.between(MailhouseStaging_ACC#CreateTime, EarliestDate, endOfLatestDate);
    }
  }

  function checkForDateExceptions(earlierDate : Date, laterDate : Date) {
    if (earlierDate != null && laterDate != null && laterDate.before(earlierDate)) {
      throw new DisplayableException(DisplayKey.get("Web.Error.LaterDateBeforeEarlierDate"));
    }
  }

}