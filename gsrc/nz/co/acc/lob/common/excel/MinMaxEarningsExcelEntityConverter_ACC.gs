package nz.co.acc.lob.common.excel

uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses gw.validation.PCValidationResult
uses nz.co.acc.lob.util.AdminUtil_ACC
uses nz.co.acc.sampledata.EarningsMinMaxDataBuilder_ACC
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
uses org.apache.poi.ss.usermodel.DataFormatter
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

/**
 * Entity to spreadsheet converter for the Business Industry Code entity.
 */
class MinMaxEarningsExcelEntityConverter_ACC implements ExcelEntityConverter_ACC<EarningsMinMaxData_ACC> {
  var _validationResult = new PCValidationResult()

  override function getPCValidationResult(): PCValidationResult {
    return _validationResult
  }

  override function getFileName(): String {
    return "MinMaxEarnings_ACC"
  }

  override function getSheetName(): String {
    return "MinMaxEarnings_ACC"
  }

  override function getHeadings(): List<String> {
    return {"Policy Start Date", "Policy End Date", "CP Full Time Minimum", "CP Full Time Maximum", "CPX Full Time Minimum", 'CPX Full Time Maximum', "WPS Final Maximum"}
  }

  override function parseRow(row: Row, rowNumber: Integer): ExcelRow {
    // Start date
    var startDateCell = row.getCell(0)
    var startDate = startDateCell.getDateCellValue()

    // End date
    var endDateCell = row.getCell(1)
    new DataFormatter().formatCellValue(endDateCell)
    var endDate = endDateCell.getDateCellValue()

    // FullTime Minimum CP
    var fullTimeMinimumCP = row.getCell(2)
    var fullTimeMinCP : String = null
    if (fullTimeMinimumCP != null) {
      if (fullTimeMinimumCP.CellType == CellType.NUMERIC) {
        var fullTimeMinimumCPNumericValue = fullTimeMinimumCP.getNumericCellValue()
        var ftMinCPInt = fullTimeMinimumCPNumericValue as long
        fullTimeMinCP = String.valueOf(ftMinCPInt)
      } else if (fullTimeMinimumCP.CellType == CellType.STRING) {
        fullTimeMinCP = fullTimeMinimumCP.getStringCellValue()
      }
    }

    // FullTime Maximum CP
    var fullTimeMaximumCP = row.getCell(3)
    var fullTimeMaxCP : String = null
    if (fullTimeMaximumCP != null) {
      if (fullTimeMaximumCP.CellType == CellType.NUMERIC) {
        var fullTimeMaximumCPNumericValue = fullTimeMaximumCP.getNumericCellValue()
        var ftMaxCPInt = fullTimeMaximumCPNumericValue as long
        fullTimeMaxCP = String.valueOf(ftMaxCPInt)
      } else if (fullTimeMaximumCP.CellType == CellType.STRING) {
        fullTimeMaxCP = fullTimeMaximumCP.getStringCellValue()
      }
    }

    // FullTime Minimum CPX
    var fullTimeMinimumCPX = row.getCell(4)
    var fullTimeMinCPX : String = null
    if (fullTimeMinimumCPX != null) {
      if (fullTimeMinimumCPX.CellType == CellType.NUMERIC) {
        var fullTimeMinimumCPXNumericValue = fullTimeMinimumCPX.getNumericCellValue()
        var ftMinCPXInt = fullTimeMinimumCPXNumericValue as long
        fullTimeMinCPX = String.valueOf(ftMinCPXInt)
      } else if (fullTimeMinimumCPX.CellType == CellType.STRING) {
        fullTimeMinCPX = fullTimeMinimumCPX.getStringCellValue()
      }
    }

    // FullTime Maximum CPX
    var fullTimeMaximumCPX = row.getCell(5)
    var fullTimeMaxCPX : String = null
    if (fullTimeMaximumCPX != null) {
      if (fullTimeMaximumCPX.CellType == CellType.NUMERIC) {
        var fullTimeMaximumCPXNumericValue = fullTimeMaximumCPX.getNumericCellValue()
        var ftMaxCPXInt = fullTimeMaximumCPXNumericValue as long
        fullTimeMaxCPX = String.valueOf(ftMaxCPXInt)
      } else if (fullTimeMaximumCPX.CellType == CellType.STRING) {
        fullTimeMaxCPX = fullTimeMaximumCPX.getStringCellValue()
      }
    }

    // FullTime Maximum WPS
    var finalMaximumWPS = row.getCell(6)
    var finalMaxWPS : String = null
    if (finalMaximumWPS != null) {
      if (finalMaximumWPS.CellType == CellType.NUMERIC) {
        var finalMaximumWPSNumericValue = finalMaximumWPS.getNumericCellValue()
        var finalMaxWPSInt = finalMaximumWPSNumericValue as long
        finalMaxWPS = String.valueOf(finalMaxWPSInt)
      } else if (finalMaximumWPS.CellType == CellType.STRING) {
        finalMaxWPS = finalMaximumWPS.getStringCellValue()
      }
    }

    if(startDate == null or endDate == null or fullTimeMinCP == null or fullTimeMaxCP == null or fullTimeMinCPX == null or fullTimeMaxCPX == null or finalMaxWPS == null){
      return new MinMaxEarningsExcelRow_ACC(null, null, null, null, null, null,null)
    }
    // Create the data object
    var excelData = new MinMaxEarningsExcelRow_ACC(startDate, endDate, new MonetaryAmount(fullTimeMinCP.toBigDecimal(), Currency.TC_NZD),
                                               new MonetaryAmount(fullTimeMaxCP.toBigDecimal(), Currency.TC_NZD), new MonetaryAmount(fullTimeMinCPX.toBigDecimal(), Currency.TC_NZD),
                                               new MonetaryAmount(fullTimeMaxCPX.toBigDecimal(), Currency.TC_NZD), new MonetaryAmount(finalMaxWPS.toBigDecimal(), Currency.TC_NZD))
    return excelData
  }

  override function updateOrInsertEntity(row: Row, rowNumber: Integer) {
    var excelRow = parseRow(row, rowNumber) as MinMaxEarningsExcelRow_ACC
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.PolicyStartDate
    // end date
    var endDate = excelRow.PolicyEndDate
    // Full Time Minimum CP
    var fullTimeMinimumCP = excelRow.FullTimeMinimumCP
    // Full Time Maximum CP
    var fullTimeMaximumCP = excelRow.FullTimeMaximumCP
    // Full Time Minimum CPX
    var fullTimeMinimumCPX = excelRow.FullTimeMinimumCPX
    // Full Time Maximum CPX
    var fullTimeMaximumCPX = excelRow.FullTimeMaximumCPX
    // Final Maximum WPS
    var finalMaximumWPS = excelRow.FinalMaximumWPS

    // Find the entity in the database and update/insert
    var minMaxEntity = AdminUtil_ACC.findMinMaxEntry(startDate, endDate)
    if (minMaxEntity != null) { // update CU Desc
      if (!fullTimeMinimumCP.equals(minMaxEntity.FullTimeMinimumCP)) { // only update FullTimeMinimumCP if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableMinMaxEntity = b.add(minMaxEntity)
          updateableMinMaxEntity.setFullTimeMinimumCP(fullTimeMinimumCP)
        })
      }
      if (!fullTimeMaximumCP.equals(minMaxEntity.FullTimeMaximumCP)) { // only update FullTimeMaximumCP if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableMinMaxEntity = b.add(minMaxEntity)
          updateableMinMaxEntity.setFullTimeMaximumCP(fullTimeMaximumCP)
        })
      }
      if (!fullTimeMinimumCPX.equals(minMaxEntity.FullTimeMinimumCPX)) { // only update FullTimeMinimumCPX if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableMinMaxEntity = b.add(minMaxEntity)
          updateableMinMaxEntity.setFullTimeMinimumCPX(fullTimeMinimumCPX)
        })
      }
      if (!fullTimeMaximumCPX.equals(minMaxEntity.FullTimeMaximumCPX)) { // only update FullTimeMaximumCPX if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableMinMaxEntity = b.add(minMaxEntity)
          updateableMinMaxEntity.setFullTimeMaximumCPX(fullTimeMaximumCPX)
        })
      }
      if (!finalMaximumWPS.equals(minMaxEntity.FinalMaximumWPS)) { // only update FinalMaximumWPS if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableMinMaxEntity = b.add(minMaxEntity)
          updateableMinMaxEntity.setFinalMaximumWPS(finalMaximumWPS)
        })
      }
    } else { //insert new row
      var result: EarningsMinMaxData_ACC
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var builder = new EarningsMinMaxDataBuilder_ACC()
            .withPolicyStartDate(startDate)
            .withPolicyEndDate(endDate)
            .withFullTimeMinimumCP(fullTimeMinimumCP)
            .withFullTimeMaximumCP(fullTimeMaximumCP)
            .withFullTimeMinimumCPX(fullTimeMinimumCPX)
            .withFullTimeMaximumCPX(fullTimeMaximumCPX)
            .withFinalMaximumWPS(finalMaximumWPS)

        result = builder.create(b)
      })
    }
  }

  override function validateRow(row: Row, rowNumber: Integer) {
    var excelRow = parseRow(row, rowNumber) as MinMaxEarningsExcelRow_ACC
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.PolicyStartDate
    // end date
    var endDate = excelRow.PolicyEndDate
    // Full Time Minimum CP
    var fullTimeMinimumCP = excelRow.FullTimeMinimumCP
    // Full Time Maximum CP
    var fullTimeMaximumCP = excelRow.FullTimeMaximumCP
    // Full Time Minimum CPX
    var fullTimeMinimumCPX = excelRow.FullTimeMinimumCPX
    // Full Time Maximum CPX
    var fullTimeMaximumCPX = excelRow.FullTimeMaximumCPX
    // Final Maximum WPS
    var finalMaximumWPS = excelRow.FinalMaximumWPS

    var dummyMinMax = new EarningsMinMaxData_ACC()
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
      if (fullTimeMinimumCP == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.FullTimeMinCP", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }
      if (fullTimeMaximumCP == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.FullTimeMaxCP", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }
      if (fullTimeMinimumCPX == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.FullTimeMinCPX", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }
      if (fullTimeMaximumCPX == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.FullTimeMaxCPX", rowNumber)
        _validationResult.addError(dummyMinMax, ValidationLevel.TC_DEFAULT, msg)
      }
      if (finalMaximumWPS == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.MinMaxEarnings_Data.FinalMaxWPS", rowNumber)
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

  override function addEntityToSheet(entity: EarningsMinMaxData_ACC, workbook: Workbook, sheet: Sheet, rowNumber: Integer) {
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

    // Full Time Min CP
    var fullTimeMinCP = row.createCell(2)
    fullTimeMinCP.setCellValue(entity.FullTimeMinimumCP.toString())

    // Full Time Max CP
    var fullTimeMaxCP = row.createCell(3)
    fullTimeMaxCP.setCellValue(entity.FullTimeMaximumCP.toString())

    // Full Time Min CPX
    var fullTimeMinCPX = row.createCell(4)
    fullTimeMinCPX.setCellValue(entity.FullTimeMinimumCPX.toString())

    // Full Time Max CPX
    var fullTimeMaxCPX = row.createCell(4)
    fullTimeMaxCPX.setCellValue(entity.FullTimeMaximumCPX.toString())

    // Final Max WPS
    var finalMaxWPS = row.createCell(4)
    finalMaxWPS.setCellValue(entity.FinalMaximumWPS.toString())
  }
}