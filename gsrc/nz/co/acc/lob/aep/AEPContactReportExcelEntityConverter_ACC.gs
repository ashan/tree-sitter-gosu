package nz.co.acc.lob.aep

uses gw.validation.PCValidationResult
uses nz.co.acc.lob.common.excel.ExcelEntityConverter_ACC
uses nz.co.acc.lob.common.excel.ExcelRow
uses org.apache.poi.ss.usermodel.Row
uses org.apache.poi.ss.usermodel.Sheet
uses org.apache.poi.ss.usermodel.Workbook

/**
 * AEP Contact Report to spreadsheet converter.
 */
class AEPContactReportExcelEntityConverter_ACC implements ExcelEntityConverter_ACC<AEPContactReportRowData> {

  override function getPCValidationResult() : PCValidationResult {
    return null
  }

  override function getFileName() : String {
    return "AEP Contact Report"
  }

  override function getSheetName() : String {
    return "AEP Contact Report"
  }

  override function getHeadings() : List<String> {
    return {"AEPContractNumber_ACC", "AccountName", "RelationshipManager", "ComplianceAdvisor", "ContactType", "ContactRole",
        "CustomerName", "AEPTPAAgreement", "AEPTPANature", "WorkPhone", "HomePhone", "CellPhone",
        "EmailAddress1", "EmailAddress2", "PrimaryAttentionTo", "PrimaryAddressLine1", "PrimaryAddressLine2",
        "PrimaryAddressLine3", "PrimaryCity", "PrimaryPostalCode", "PrimaryCountry", "Preferred Physical",
        "Preferred Postal", "Claims Physical", "Claims Postal"}
  }

  override function parseRow(row : Row, rowNumber : Integer) : ExcelRow {
    return null
  }

  override function updateOrInsertEntity(row : Row, rowNumber : Integer) {
  }

  override function validateRow(row : Row, rowNumber : Integer) {
  }

  override function addEntityToSheet(aepContact : AEPContactReportRowData, workbook : Workbook, sheet : Sheet, rowNumber : Integer) {
    var row = sheet.createRow(rowNumber)
    row.createCell(0).setCellValue(aepContact.AEPContractNumber_ACC)
    row.createCell(1).setCellValue(aepContact.AccountName)
    row.createCell(2).setCellValue(aepContact.RelationshipManager)
    row.createCell(3).setCellValue(aepContact.ComplianceAdvisor)
    row.createCell(4).setCellValue(aepContact.ContactType)
    row.createCell(5).setCellValue(aepContact.ContactRole)
    row.createCell(6).setCellValue(aepContact.CustomerName)
    row.createCell(7).setCellValue(aepContact.AEPTPAAgreement)
    row.createCell(8).setCellValue(aepContact.AEPTPANature)
    row.createCell(9).setCellValue(aepContact.WorkPhone)
    row.createCell(10).setCellValue(aepContact.HomePhone)
    row.createCell(11).setCellValue(aepContact.CellPhone)
    row.createCell(12).setCellValue(aepContact.EmailAddress1)
    row.createCell(13).setCellValue(aepContact.EmailAddress2)
    row.createCell(14).setCellValue(aepContact.PrimaryAttentionTo)
    row.createCell(15).setCellValue(aepContact.PrimaryAddressLine1)
    row.createCell(16).setCellValue(aepContact.PrimaryAddressLine2)
    row.createCell(17).setCellValue(aepContact.PrimaryAddressLine3)
    row.createCell(18).setCellValue(aepContact.PrimaryCity)
    row.createCell(19).setCellValue(aepContact.PrimaryPostalCode)
    row.createCell(20).setCellValue(aepContact.PrimaryCountry)
    row.createCell(21).setCellValue(aepContact.PreferredPhysical)
    row.createCell(22).setCellValue(aepContact.PreferredPostal)
    row.createCell(23).setCellValue(aepContact.ClaimsPhysical)
    row.createCell(24).setCellValue(aepContact.ClaimsPostal)
  }
}