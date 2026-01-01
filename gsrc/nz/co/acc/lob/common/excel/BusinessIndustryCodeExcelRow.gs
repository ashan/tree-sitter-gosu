package nz.co.acc.lob.common.excel

/**
 * The parsed BIC data from the Excel data
 */
class BusinessIndustryCodeExcelRow implements ExcelRow {
  var _startDate : Date as StartDate
  var _endDate : Date as EndDate
  var _businessIndustryCode : String as BusinessIndustryCode
  var _businessIndustryDescription : String as BusinessIndustryDescription
  var _classificationUnitCode : String as ClassificationUnitCode

  construct(startDate : Date, endDate : Date, businessIndustryCode : String, businessIndustryDescription : String, classificationUnitCode : String) {
    _startDate = startDate
    _endDate = endDate
    _businessIndustryCode = businessIndustryCode
    _businessIndustryDescription = businessIndustryDescription
    _classificationUnitCode = classificationUnitCode
  }

  override function rowEmpty(): boolean {
    return _startDate == null and _endDate == null and _businessIndustryCode == null and _businessIndustryDescription == null and _classificationUnitCode == null
  }

  override function anyDataMissing(): boolean {
    return _startDate == null or _endDate == null or _businessIndustryCode == null or _businessIndustryDescription == null or _classificationUnitCode == null
  }
}