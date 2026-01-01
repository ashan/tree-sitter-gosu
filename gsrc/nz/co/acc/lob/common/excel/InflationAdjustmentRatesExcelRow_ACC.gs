package nz.co.acc.lob.common.excel

uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.common.excel.ExcelRow

/**
 * The parsed BIC data from the Excel data
 */
class InflationAdjustmentRatesExcelRow_ACC implements ExcelRow {
  var _startDate : Date as PolicyStartDate
  var _endDate : Date as PolicyEndDate
  var _ratePercent : Double as RatePercent

  construct(startDate : Date, endDate : Date, ratePercent : Double) {
    _startDate = startDate
    _endDate = endDate
    _ratePercent = ratePercent
  }

  override function rowEmpty(): boolean {
    return _startDate == null and _endDate == null and _ratePercent == null
  }

  override function anyDataMissing(): boolean {
    return _startDate == null or _endDate == null or _ratePercent == null
  }
}