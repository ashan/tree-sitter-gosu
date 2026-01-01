package nz.co.acc.er.excel

uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationResult
uses nz.co.acc.er.databeans.RehabRiskMgmtRates_ACC
uses nz.co.acc.lob.common.excel.ExcelEntityConverter_ACC
uses nz.co.acc.lob.common.excel.ExcelRow
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

/**
 * Created by manubaf on 13/02/2020.
 */
class RehabRIskMgmtRateRowConverter implements ExcelEntityConverter_ACC<RehabRiskMgmtRates_ACC> {
  var _validationResult = new PCValidationResult()

  override function getPCValidationResult() : PCValidationResult {
    return _validationResult
  }

  override function getFileName() : String {
    return "RehabRiskMgmtRates_"+Date.CurrentDate.getTime()
  }

  override function getSheetName() : String {
    return "RehabRiskMgmtRates"
  }

  override function getHeadings() : List<String> {
    return {DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.LRGCode_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.LRGDesc_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.ExperienceYear_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.LiableEarnings_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.CappedWCD_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.MedicalSpendClaims_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.ExpectedRehabMgmtRate_ACC"),
            DisplayKey.get("Web.ExperienceRating.RehabRiskMgmtRates.ExpectedRiskMgmtRate_ACC")}
  }

  override function parseRow(row : Row, rowNumber : Integer) : ExcelRow {
    // not required
    return null
  }

  override function updateOrInsertEntity(row : Row, rowNumber : Integer) {
    // not required
  }

  override function validateRow(row : Row, rowNumber : Integer) {
    // not required
  }

  override function addEntityToSheet(entity : RehabRiskMgmtRates_ACC, workbook : Workbook, sheet : Sheet, rowNumber : Integer) {
    var row = sheet.createRow(rowNumber)

    row.createCell(0).setCellValue(entity.LRGCode)
    row.createCell(1).setCellValue(entity.LRGDesc)
    row.createCell(2).setCellValue(entity.ExperienceYear)
    row.createCell(3).setCellValue(entity.LiableEarnings.toEngineeringString())
    row.createCell(4).setCellValue(entity.CappedWCD)
    row.createCell(5).setCellValue(entity.MedicalSpendClaims)
    row.createCell(6).setCellValue(entity.ExpectedRehabMgmtRate.toEngineeringString())
    row.createCell(7).setCellValue(entity.ExpectedRiskMgmtRate.toEngineeringString())
  }
}