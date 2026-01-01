package nz.co.acc.lob.aep

uses gw.validation.PCValidationResult
uses nz.co.acc.lob.common.excel.ExcelEntityConverter_ACC
uses nz.co.acc.lob.common.excel.ExcelRow
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

/**
 * AEP Contract Report to spreadsheet converter.
 */
class AEPContractReportExcelEntityConverter_ACC implements ExcelEntityConverter_ACC<AEPContractReportRowData> {

  override function getPCValidationResult() : PCValidationResult {
    return null
  }

  override function getFileName() : String {
    return "AEP Contract Report"
  }

  override function getSheetName() : String {
    return "AEP Contract Report"
  }

  override function getHeadings() : List<String> {
    return {"AEPContractNumber_ACC", "AccountName", "PrimeAccountNumber",
        "AEPAgreementOrigSignedDate_ACC", "StatusOfAccount",
        "RelationshipManager", "RMPhone", "RMEmail",
        "ComplianceAdvisor", "CAPhone", "CAEmail",
        "AEPPlanStartDate", "AEPPlanEndDate",
        "ContractPlanType", "ClaimManagementPeriod", "HighCostClaimsCover", "StopLossPercentage", "AuditResult",
        "ValidForClaimsReg_ACC", "NumberFTEs"}
  }

  override function parseRow(row : Row, rowNumber : Integer) : ExcelRow {
    return null
  }

  override function updateOrInsertEntity(row : Row, rowNumber : Integer) {
  }

  override function validateRow(row : Row, rowNumber : Integer) {
  }

  override function addEntityToSheet(aepContract : AEPContractReportRowData, workbook : Workbook, sheet : Sheet, rowNumber : Integer) {
    var row = sheet.createRow(rowNumber)
    var creationHelper = workbook.CreationHelper
    var dateCellStyle = workbook.createCellStyle()
    dateCellStyle.DataFormat = creationHelper.createDataFormat().getFormat("dd-MM-yyyy")
    row.createCell(0).setCellValue(aepContract.AEPContractNumber_ACC)
    row.createCell(1).setCellValue(aepContract.AccountName)
    row.createCell(2).setCellValue(aepContract.PrimeAccountNumber)
    var aepAgreementOrigSignedDateCell = row.createCell(3)
    aepAgreementOrigSignedDateCell.CellStyle = dateCellStyle
    aepAgreementOrigSignedDateCell.setCellValue(aepContract.AEPAgreementOrigSignedDate_ACC)
    row.createCell(4).setCellValue(aepContract.StatusOfAccount)
    row.createCell(5).setCellValue(aepContract.RelationshipManager)
    row.createCell(6).setCellValue(aepContract.RMPhone)
    row.createCell(7).setCellValue(aepContract.RMEmail)
    row.createCell(8).setCellValue(aepContract.ComplianceAdvisor)
    row.createCell(9).setCellValue(aepContract.CAPhone)
    row.createCell(10).setCellValue(aepContract.CAEmail)
    var aepPlanStartDateCell = row.createCell(11)
    aepPlanStartDateCell.CellStyle = dateCellStyle
    aepPlanStartDateCell.setCellValue(aepContract.AEPPlanStartDate)
    var aepPlanEndDateCell = row.createCell(12)
    aepPlanEndDateCell.CellStyle = dateCellStyle
    aepPlanEndDateCell.setCellValue(aepContract.AEPPlanEndDate)
    row.createCell(13).setCellValue(aepContract.ContractPlanType)
    row.createCell(14).setCellValue(aepContract.ClaimManagementPeriod)
    row.createCell(15).setCellValue(aepContract.HighCostClaimsCover)
    row.createCell(16).setCellValue(aepContract.StopLossPercentage)
    row.createCell(17).setCellValue(aepContract.AuditResult)
    row.createCell(18).setCellValue(aepContract.ValidForClaimsReg_ACC)
    row.createCell(19).setCellValue(aepContract.NumberFTEs)
  }
}