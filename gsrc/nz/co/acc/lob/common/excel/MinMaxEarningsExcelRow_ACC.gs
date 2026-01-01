package nz.co.acc.lob.common.excel

uses gw.pl.currency.MonetaryAmount

/**
 * The parsed BIC data from the Excel data
 */
class MinMaxEarningsExcelRow_ACC implements ExcelRow {
  var _startDate : Date as PolicyStartDate
  var _endDate : Date as PolicyEndDate
  var _fullTimeMinCP : MonetaryAmount as FullTimeMinimumCP
  var _fullTimeMaxCP : MonetaryAmount as FullTimeMaximumCP
  var _fullTimeMinCPX : MonetaryAmount as FullTimeMinimumCPX
  var _fullTimeMaxCPX : MonetaryAmount as FullTimeMaximumCPX
  var _finalMaxWPS : MonetaryAmount as FinalMaximumWPS

  construct(startDate : Date, endDate : Date, fullTimeMinCP : MonetaryAmount, fullTimeMaxCP : MonetaryAmount, fullTimeMinCPX : MonetaryAmount, fullTimeMaxCPX : MonetaryAmount, finalMaxWPS : MonetaryAmount) {
    _startDate = startDate
    _endDate = endDate
    _fullTimeMinCP = fullTimeMinCP
    _fullTimeMaxCP = fullTimeMaxCP
    _fullTimeMinCPX = fullTimeMinCPX
    _fullTimeMaxCPX = fullTimeMaxCPX
    _finalMaxWPS = finalMaxWPS
  }

  override function rowEmpty(): boolean {
    return _startDate == null and _endDate == null and _fullTimeMinCP == null and _fullTimeMaxCP == null and _fullTimeMinCPX == null and _fullTimeMaxCPX == null and _finalMaxWPS == null
  }

  override function anyDataMissing(): boolean {
    return _startDate == null or _endDate == null or _fullTimeMinCP == null or _fullTimeMaxCP == null or _fullTimeMinCPX == null or _fullTimeMaxCPX == null or _finalMaxWPS == null
  }
}