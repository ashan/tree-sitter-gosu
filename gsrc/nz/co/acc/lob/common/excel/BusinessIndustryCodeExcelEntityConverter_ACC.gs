package nz.co.acc.lob.common.excel

uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationResult
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.util.AdminUtil_ACC
uses nz.co.acc.sampledata.BusinessIndustryCodeBuilder_ACC
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

uses java.math.BigDecimal

/**
 * Entity to spreadsheet converter for the Business Industry Code entity.
 */
class BusinessIndustryCodeExcelEntityConverter_ACC implements ExcelEntityConverter_ACC<BusinessIndustryCode_ACC> {
  var _validationResult = new PCValidationResult()

  override function getPCValidationResult(): PCValidationResult {
    return _validationResult
  }

  override function getFileName(): String {
    return "BusinessIndustryCodes"
  }

  override function getSheetName(): String {
    return "Business Industry Codes"
  }

  override function getHeadings(): List<String> {
    return {"Start Date", "End Date", "Business Industry Code", "Business Industry Description", "Classification Unit Code"}
  }

  override function parseRow(row: Row, rowNumber: Integer): ExcelRow {
    // Start date
    var startDateCell = row.getCell(0)
    var startDate = startDateCell.getDateCellValue()

    // End date
    var endDateCell = row.getCell(1)
    var endDate = endDateCell.getDateCellValue()

    // Business Industry Code
    var bicCodeCell = row.getCell(2)
    var bicCode : String = null
    if (bicCodeCell != null) {
      if (bicCodeCell.CellType == CellType.NUMERIC) {
        var bicCodeDouble = bicCodeCell.getNumericCellValue()
        var bicCodeInt = bicCodeDouble as long
        bicCode = String.valueOf(bicCodeInt)
      } else if (bicCodeCell.CellType == CellType.STRING) {
        bicCode = bicCodeCell.getStringCellValue()
      }
    }

    // Business Industry Description
    var bicDescCell = row.getCell(3)
    var bicDesc : String = null
    if (bicDescCell != null) {
      if (bicDescCell.CellType == CellType.NUMERIC) {
        var bicDescDouble = bicDescCell.getNumericCellValue()
        var bicDescInt = bicDescDouble as long
        bicDesc = String.valueOf(bicDescInt)
      } else if (bicDescCell.CellType == CellType.STRING) {
        bicDesc = bicDescCell.getStringCellValue()
      }
    }

    // Classification Unit Code
    var cuCodeCell = row.getCell(4)
    var cuCode : String = null
    if (cuCodeCell != null) {
      if (cuCodeCell.CellType == CellType.NUMERIC) {
        var cuCodeDouble = cuCodeCell.getNumericCellValue()
        // the cuCodeDouble is a double in the format of e.g. 96290.0
        // convert this to a String e.g. "96290"
        var cuCodeInt = cuCodeDouble as long
        cuCode = String.valueOf(cuCodeInt)
      } else if (cuCodeCell.CellType == CellType.STRING) {
        cuCode = cuCodeCell.getStringCellValue()
      }
    }

    // Create the data object
    var excelData = new BusinessIndustryCodeExcelRow(startDate, endDate, bicCode, bicDesc, cuCode)
    return excelData
  }

  override function updateOrInsertEntity(row: Row, rowNumber: Integer) {
    var excelRow = parseRow(row, rowNumber) as BusinessIndustryCodeExcelRow
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.StartDate
    // end date
    var endDate = excelRow.EndDate
    // Business Industry Code
    var bicCode = excelRow.BusinessIndustryCode
    // Business Industry Description
    var bicDesc = excelRow.BusinessIndustryDescription
    // Classification Unit Code
    var cuCode = excelRow.ClassificationUnitCode

    // Find the entity in the database and update/insert
    var bicEntity = AdminUtil_ACC.findBusinessIndustryCode(bicCode, startDate, endDate)
    if (bicEntity != null) { // update CU Desc
      if (!bicDesc.equals(bicEntity.BusinessIndustryDescription)) { // only update if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableBICEntity = b.add(bicEntity)
          updateableBICEntity.setBusinessIndustryDescription(bicDesc)
        })
      }
      // update CU
      if (!cuCode.equals(bicEntity.ClassificationUnit_ACC.ClassificationUnitCode)) { // only update if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var classificationUnit = AdminUtil_ACC.findClassificationUnit(cuCode, startDate, endDate)
          var updateableBICEntity = b.add(bicEntity)
          updateableBICEntity.setClassificationUnit_ACC(classificationUnit)
        })
      }
    } else { //insert new row
      var result: BusinessIndustryCode_ACC
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var classificationUnit = AdminUtil_ACC.findClassificationUnit(cuCode, startDate, endDate)
        var builder = new BusinessIndustryCodeBuilder_ACC()
            .withBusinessIndustryCode(bicCode)
            .withBusinessIndustryDescription(bicDesc)
            .withStartDate(startDate)
            .withEndDate(endDate)
            .withClassificationUnit(classificationUnit)

        result = builder.create(b)
      })
    }
  }

  override function validateRow(row: Row, rowNumber: Integer) {
    var excelRow = parseRow(row, rowNumber) as BusinessIndustryCodeExcelRow
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.StartDate
    // end date
    var endDate = excelRow.EndDate
    // Business Industry Code
    var bicCode = excelRow.BusinessIndustryCode
    // Business Industry Description
    var bicDesc = excelRow.BusinessIndustryDescription
    // Classification Unit Code
    var cuCode = excelRow.ClassificationUnitCode

    var dummyCU = new ClassificationUnit_ACC()
    // None of the BIC data can be missing individually
    if (excelRow.anyDataMissing()) {
      if (startDate == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.StartDateMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (endDate == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.EndDateMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (bicCode == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.BICCodeMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (bicDesc == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.BICDescriptionMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (cuCode == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.CUCodeMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      // if any data is missing there is no way to do further validation, so return
      return
    }

    // validate that the CU code is not too long
    // Get values from script parameters
    var cuCodeMaxLength = (ScriptParameters.getParameterValue("ClassificationUnitMaxLength_ACC") as BigDecimal).intValue()
    if (cuCode.length > cuCodeMaxLength) { // too long
      var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.CUCodeTooLong", cuCode, rowNumber, cuCodeMaxLength)
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
    }

    // validate that the BIC code is not too long
    // Get values from script parameters
    var bicMaxLength = (ScriptParameters.getParameterValue("BusinessIndustryCodeMaxLength_ACC") as BigDecimal).intValue()
    if (bicCode.length > bicMaxLength) { // too long
      var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.BusinessIndustryCodeCodeTooLong", bicCode, rowNumber, bicMaxLength)
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
    }

    // validate that the CU code is a number
    try {
      var cuCodeAsNumber = Long.parseLong(cuCode) // try to convert to an integer
    } catch (e : Exception) {
      var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.CUCodeNotNumber", cuCode, rowNumber)
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
    }

    // validate the start and end dates are both 01/04/YYYY
    var validateStartDateMessage = AdminUtil_ACC.validateClassificationUnitStartDate(startDate, rowNumber)
    if (validateStartDateMessage != null) {
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, validateStartDateMessage)
    }
    var validateEndDateMessage = AdminUtil_ACC.validateClassificationUnitEndDate(endDate, rowNumber)
    if (validateEndDateMessage != null) {
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, validateEndDateMessage)
    }

    // only validate validate the end date is one year after start date if there are no errors above
    if (validateStartDateMessage == null and validateEndDateMessage == null) { // no errors above
      var validateEndDateNotAfterStartDateMessage = AdminUtil_ACC.validateClassificationUnitEndDateOneYearAfterStartDate(startDate, endDate, rowNumber)
      if (validateEndDateNotAfterStartDateMessage != null) {
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, validateEndDateNotAfterStartDateMessage)
      }
    }

    // Validate CU exists
    var foundCU = AdminUtil_ACC.findClassificationUnit(cuCode, startDate, endDate)
    if (foundCU == null) { // CU not found
      var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.ClassificationUnitNotFound", cuCode, rowNumber, DateUtil_ACC.createDateAsString(startDate, "dd/MM/yyyy"), DateUtil_ACC.createDateAsString(endDate, "dd/MM/yyyy"), bicCode, cuCode)
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
    }

  }

  override function addEntityToSheet(entity: BusinessIndustryCode_ACC, workbook: Workbook, sheet: Sheet, rowNumber: Integer) {
    var row = sheet.createRow(rowNumber)
    var creationHelper = workbook.CreationHelper

    // start date
    var startDateCell = row.createCell(0)
    var startDateCellStyle = workbook.createCellStyle()
    startDateCellStyle.DataFormat = creationHelper.createDataFormat().getFormat("yyyy-MM-dd")
    startDateCell.CellStyle = startDateCellStyle
    startDateCell.setCellValue(entity.StartDate)

    // end date
    var endDateCell = row.createCell(1)
    var endDateCellStyle = workbook.createCellStyle()
    endDateCellStyle.DataFormat = creationHelper.createDataFormat().getFormat("yyyy-MM-dd")
    endDateCell.CellStyle = endDateCellStyle
    endDateCell.setCellValue(entity.EndDate)

    // Business Industry Code
    var bicCodeCell = row.createCell(2)
    bicCodeCell.setCellValue(entity.BusinessIndustryCode)

    // Business Industry Description
    var bicDescriptionCell = row.createCell(3)
    bicDescriptionCell.setCellValue(entity.BusinessIndustryDescription)

    // Classification Unit Code
    var cuCodeCell = row.createCell(4)
    cuCodeCell.setCellValue(entity.ClassificationUnit_ACC.ClassificationUnitCode)
  }
}