package nz.co.acc.lob.common.excel

uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationResult
uses nz.co.acc.lob.util.AdminUtil_ACC
uses nz.co.acc.sampledata.InflationAdjustmentBuilder_ACC
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
uses org.apache.poi.ss.usermodel.DataFormatter
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

/**
 * Entity to spreadsheet converter for the Business Industry Code entity.
 */
class InflationAdjustmentRatesExcelEntityConverter_ACC implements ExcelEntityConverter_ACC<InflationAdjustment_ACC> {
  var _validationResult = new PCValidationResult()

  override function getPCValidationResult(): PCValidationResult {
    return _validationResult
  }

  override function getFileName(): String {
    return "InflationAdjustmentRates_ACC"
  }

  override function getSheetName(): String {
    return "InflationAdjustmentRates_ACC"
  }

  override function getHeadings(): List<String> {
    return {"Policy Start Date", "Policy End Date", "RatePercent"}
  }

  override function parseRow(row: Row, rowNumber: Integer): ExcelRow {
    // Start date
    var startDateCell = row.getCell(0)
    var startDate = startDateCell.getDateCellValue()

    // End date
    var endDateCell = row.getCell(1)
    new DataFormatter().formatCellValue(endDateCell)
    var endDate = endDateCell.getDateCellValue()

    // Rate Percent
    var ratePercentCell = row.getCell(2)
    var ratePercent : Double = null
    if (ratePercentCell != null) {
      if (ratePercentCell.CellType == CellType.NUMERIC) {
        ratePercent = ratePercentCell.getNumericCellValue() as Double
      } else if (ratePercentCell.CellType == CellType.STRING) {
        ratePercent= ratePercentCell.getStringCellValue().toDouble()
      }
    }

    if(startDate == null or endDate == null or ratePercent == null){
      return new InflationAdjustmentRatesExcelRow_ACC(null, null, null)
    }
    // Create the data object
    var excelData = new InflationAdjustmentRatesExcelRow_ACC(startDate, endDate, ratePercent)
    return excelData
  }

  override function updateOrInsertEntity(row: Row, rowNumber: Integer) {
    var excelRow = parseRow(row, rowNumber) as InflationAdjustmentRatesExcelRow_ACC
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.PolicyStartDate
    // end date
    var endDate = excelRow.PolicyEndDate
    // Rate Percent
    var ratePercent = excelRow.RatePercent



    // Find the entity in the database and update/insert
    var InflationAdjustmentEntity = AdminUtil_ACC.findInflationRate(startDate, endDate)
    if (InflationAdjustmentEntity != null) { // update CU Desc
      if (!ratePercent.equals(InflationAdjustmentEntity.RatePercent)) { // only update RatePercent if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableInflationAdjEntity = b.add(InflationAdjustmentEntity)
          updateableInflationAdjEntity.setRatePercent(ratePercent)
        })
      }
    } else { //insert new row
      var result: InflationAdjustment_ACC
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var builder = new InflationAdjustmentBuilder_ACC()
            .withPolicyStartDate(startDate)
            .withPolicyEndDate(endDate)
            .withRatePercent(ratePercent)

        result = builder.create(b)
      })
    }
  }

  override function validateRow(row: Row, rowNumber: Integer) {
    var excelRow = parseRow(row, rowNumber) as InflationAdjustmentRatesExcelRow_ACC
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.PolicyStartDate
    // end date
    var endDate = excelRow.PolicyEndDate
    // Rate Percent
    var ratePercent = excelRow.RatePercent

    var dummyMinMax = new InflationAdjustment_ACC()
    // None of the BIC data can be missing individually
    if (excelRow.anyDataMissing()) {
      if (startDate == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.StartDateMissing", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }
      if (endDate == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.EndDateMissing", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }
      if (ratePercent == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.InflationAdjustment_Data.RatePercent", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }

      // if any data is missing there is no way to do further validation, so return
      return
    }

    // validate the start and end dates are both 01/04/YYYY
    var validateStartDateMessage = AdminUtil_ACC.validateClassificationUnitStartDate(startDate, rowNumber)
    if (validateStartDateMessage != null) {
      _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, validateStartDateMessage)
    }
    var validateEndDateMessage = AdminUtil_ACC.validateMinMaxInflationRateEndDate(endDate, rowNumber)
    if (validateEndDateMessage != null) {
      _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, validateEndDateMessage)
    }

    // only validate validate the end date is one year after start date if there are no errors above
    if (validateStartDateMessage == null and validateEndDateMessage == null) { // no errors above
      var validateEndDateNotAfterStartDateMessage = AdminUtil_ACC.validateClassificationUnitEndDateOneYearAfterStartDate(startDate, endDate, rowNumber)
      if (validateEndDateNotAfterStartDateMessage != null) {
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, validateEndDateNotAfterStartDateMessage)
      }
    }

  }

  override function addEntityToSheet(entity: InflationAdjustment_ACC, workbook: Workbook, sheet: Sheet, rowNumber: Integer) {
    var row = sheet.createRow(rowNumber)
    var creationHelper = workbook.CreationHelper

    // start date
    var startDateCell = row.createCell(0)
    var startDateCellStyle = workbook.createCellStyle()
    startDateCellStyle.DataFormat = creationHelper.createDataFormat().getFormat("yyyy-MM-dd")
    startDateCell.CellStyle = startDateCellStyle
    startDateCell.setCellValue(entity.PolicyStartDate)

    // end date
    var endDateCell = row.createCell(1)
    var endDateCellStyle = workbook.createCellStyle()
    endDateCellStyle.DataFormat = creationHelper.createDataFormat().getFormat("yyyy-MM-dd")
    endDateCell.CellStyle = endDateCellStyle
    endDateCell.setCellValue(entity.PolicyEndDate)

    // Rate Percent
    var ratePercentCell = row.createCell(2)
    ratePercentCell.setCellValue(entity.RatePercent.toString())

  }
}