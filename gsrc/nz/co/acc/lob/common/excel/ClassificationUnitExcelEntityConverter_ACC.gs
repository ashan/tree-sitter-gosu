package nz.co.acc.lob.common.excel

uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount
uses gw.validation.PCValidationResult
uses nz.co.acc.lob.util.AdminUtil_ACC
uses nz.co.acc.sampledata.ClassificationUnitBuilder_ACC
uses org.apache.poi.ss.usermodel.Cell
uses org.apache.poi.ss.usermodel.CellType
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Entity to spreadsheet converter for the Classification Unit entity.
 */
class ClassificationUnitExcelEntityConverter_ACC implements ExcelEntityConverter_ACC<ClassificationUnit_ACC> {
  var _validationResult = new PCValidationResult()

  public function getPCValidationResult() : PCValidationResult {
    return _validationResult
  }

  public function getFileName() : String {
    return "ClassificationUnits"
  }

  public function getSheetName() : String {
    return "Classification Units"
  }

  public function getHeadings() : List<String> {
    return {"Start Date", "End Date", "Classification Unit Code", "Classification Unit Description", "Replacement Labour Cost"}
  }

  override function updateOrInsertEntity(row: Row, rowNumber : Integer) {
    var excelRow = parseRow(row, rowNumber) as ClassificationUnitExcelRow
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.StartDate
    // end date
    var endDate = excelRow.EndDate
    // Classification Unit Code
    var cuCode = excelRow.ClassificationUnitCode
    // Classification Unit Description
    var cuDesc = excelRow.ClassificationUnitDescription
    // Replacement Labour Cost
    var rlc = excelRow.ReplacementLabourCost
    var rlcDouble = Double.parseDouble(rlc) // previously validated so should be ok :)

    // Find the entity in the database and update/insert
    var classificationUnitEntity = AdminUtil_ACC.findClassificationUnit(cuCode, startDate, endDate)
    if (classificationUnitEntity != null) { // update CU Desc
      if (!cuDesc.equals(classificationUnitEntity.ClassificationUnitDescription)) { // only update if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableClassificationUnitEntity = b.add(classificationUnitEntity)
          updateableClassificationUnitEntity.setClassificationUnitDescription(cuDesc)
        })
      }
      if (classificationUnitEntity.ReplacementLabourCost != null and rlcDouble != classificationUnitEntity.ReplacementLabourCost_amt.doubleValue()) { // only update if different
        gw.transaction.Transaction.runWithNewBundle(\b -> {
          var updateableClassificationUnitEntity = b.add(classificationUnitEntity)
          var rlcMonetaryAmount = new MonetaryAmount(new BigDecimal(rlc).setScale(2, RoundingMode.HALF_UP), Currency.TC_NZD)
          updateableClassificationUnitEntity.setReplacementLabourCost(rlcMonetaryAmount)
        })
      }
    } else { //insert new row
      var rlcMonetaryAmount = new MonetaryAmount(new BigDecimal(rlc).setScale(2, RoundingMode.HALF_UP), Currency.TC_NZD)
      var result: ClassificationUnit_ACC
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var builder = new ClassificationUnitBuilder_ACC()
            .withClassificationUnitCode(cuCode)
            .withClassificationUnitDescription(cuDesc)
            .withReplacementLabourCost(rlcMonetaryAmount)
            .withStartDate(startDate)
            .withEndDate(endDate)
        result = builder.create(b)
      })
    }
  }

  public static function resetPublicID() { }

  override function validateRow(row : Row, rowNumber : Integer) {
    var excelRow = parseRow(row, rowNumber) as ClassificationUnitExcelRow
    if (excelRow.rowEmpty()) {
      // ignore this row
      return
    }
    // start date
    var startDate = excelRow.StartDate
    // end date
    var endDate = excelRow.EndDate
    // Classification Unit Code
    var cuCode = excelRow.ClassificationUnitCode
    // Classification Unit Description
    var cuDesc = excelRow.ClassificationUnitDescription
    // Replacement Labour Cost
    var rlc = excelRow.ReplacementLabourCost

    var dummyCU = new ClassificationUnit_ACC()
    // None of the CU data can be missing individually
    if (excelRow.anyDataMissing()) {
      if (startDate == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.StartDateMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (endDate == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.EndDateMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (cuCode == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.CUCodeMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (cuDesc == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.CUDescriptionMissing", rowNumber)
        _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
      }
      if (rlc == null) {
        var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.ReplacementLabourCostMissing", rowNumber)
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

    // validate that the CU code is a number
    try {
      var cuCodeAsNumber = Long.parseLong(cuCode) // try to convert to an integer
    } catch (e : Exception) {
      var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.CUCodeNotNumber", cuCode, rowNumber)
      _validationResult.addError(dummyCU, ValidationLevel.TC_DEFAULT, msg)
    }

    // validate that the Replacement Labour Cost is a number
    try {
      var rlcAsDouble = Double.parseDouble(rlc) // try to convert to an double
    } catch (e : Exception) {
      var msg = DisplayKey.get("Web.Admin_ACC.BusinessIndustryCode_ClassificationUnit_Data.ReplacementLabourCostNotNumber", rlc, rowNumber)
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
  }

  override function parseRow(row : Row, rowNumber : Integer) : ExcelRow {

    // Start date
    var startDateCell = row.getCell(0)
    var startDate = startDateCell.getDateCellValue()

    // End date
    var endDateCell = row.getCell(1)
    var endDate = endDateCell.getDateCellValue()

    // Classification Unit Code
    var cuCodeCell = row.getCell(2)
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

    // Classification Unit Description
    var cuDescCell = row.getCell(3)
    var cuDesc : String = null
    if (cuDescCell != null) {
      if (cuDescCell.CellType == CellType.NUMERIC) {
        var cuDescDouble = cuDescCell.getNumericCellValue()
        var cuDescInt = cuDescDouble as long
        cuDesc = String.valueOf(cuDescInt)
      } else if (cuDescCell.CellType == CellType.STRING) {
        cuDesc = cuDescCell.getStringCellValue()
      }
    }

    // Replacement Labour Cost
    var rlcCell = row.getCell(4)
    var rlc : String = null
    if (rlcCell != null) {
      if (rlcCell.CellType == CellType.NUMERIC) {
        var rlcDouble = rlcCell.getNumericCellValue()
        // Convert to String
        rlc = String.valueOf(rlcDouble)
      } else if (rlcCell.CellType == CellType.STRING) {
        rlc = rlcCell.getStringCellValue()
      }
    }

    // Create the data object
    var excelData = new ClassificationUnitExcelRow(startDate, endDate, cuCode, cuDesc, rlc)
    return excelData
  }

  override function addEntityToSheet(entity: ClassificationUnit_ACC, workbook : Workbook, sheet: Sheet, rowNumber : Integer) {
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

    // Classification Unit Code
    var cuCodeCell = row.createCell(2)
    cuCodeCell.setCellValue(entity.ClassificationUnitCode)

    // Classification Unit Description
    var cuDescriptionCell = row.createCell(3)
    cuDescriptionCell.setCellValue(entity.ClassificationUnitDescription)

    // Replacement Labour Cost
    var replacementLabourCostCell = row.createCell(4)
    var replacementLabourCost = entity.ReplacementLabourCost_amt
    if (replacementLabourCost != null) {
      replacementLabourCostCell.setCellValue(replacementLabourCost.doubleValue())
    } else {
      replacementLabourCostCell.setCellValue(0.0d)
    }
  }
}