package nz.co.acc.lob.common.excel

/**
 * The parsed CU data from the Excel data
 */
class ClassificationUnitExcelRow implements ExcelRow {
  var _startDate : Date as StartDate
  var _endDate : Date as EndDate
  var _classificationUnitCode : String as ClassificationUnitCode
  var _classificationUnitDescription : String as ClassificationUnitDescription
  var _replacementLabourCost : String as ReplacementLabourCost

  construct(startDate : Date, endDate : Date, classificationUnitCode : String, classificationUnitDescription : String, replacementLabourCost : String) {
    _startDate = startDate
    _endDate = endDate
    _classificationUnitCode = classificationUnitCode
    _classificationUnitDescription = classificationUnitDescription
    _replacementLabourCost = replacementLabourCost
  }

  override function rowEmpty(): boolean {
    return _startDate == null and _endDate == null and _classificationUnitCode == null and _classificationUnitDescription == null and _replacementLabourCost == null
  }

  override function anyDataMissing() : boolean {
    return _startDate == null or _endDate == null or _classificationUnitCode == null or _classificationUnitDescription == null or _replacementLabourCost == null
  }

}