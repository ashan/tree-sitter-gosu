package nz.co.acc.common.integration.files.inbound.utils

uses gw.api.database.Relop
uses gw.api.filters.StandardQueryFilter

uses java.text.SimpleDateFormat

/**
 * Created by fabianr on 26/01/2017.
 */
class InboundMonthlyFilter {
  private var _monthName: String
  private var _queryFilter: StandardQueryFilter as QueryFilter

  construct(monthName: String) {
    this._monthName = monthName
    this._queryFilter = new StandardQueryFilter(monthName,
        \query -> {
          query.and(\andCriteria -> {
            andCriteria.compare("InboundDate", Relop.GreaterThanOrEquals, monthToDate())
            andCriteria.compare("InboundDate", Relop.LessThanOrEquals, monthToDate().addMonths(1))
          })
        })
  }

  private function monthToDate(): Date {
    var cal = Calendar.getInstance();
    cal.setTime(new SimpleDateFormat("MMMM").parse(this._monthName))
    cal.set(Calendar.YEAR, Calendar.Instance.CalendarYear)
    return cal.getTime()
  }

}
