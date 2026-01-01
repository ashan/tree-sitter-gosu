package nz.co.acc.gwer.export

uses gw.api.database.IQueryBeanResult
uses nz.co.acc.common.excelexporter.ExcelExporter

class BusinessGroupSuppressionList extends ExcelExporter {

  var _businessGroups : IQueryBeanResult<ERBusinessGroup_ACC>

  construct(businessGroups : IQueryBeanResult<ERBusinessGroup_ACC>) {
    _businessGroups = businessGroups
  }

  override function writeDataToWorkSheet() {
    var sheet1 = addWorksheet("ERBusinessGroupSuppressionList")
    var dhRowCount = 1

    var table1Row = sheet1.createRow(0)
    createHeaderCellDefaultStyle(table1Row, 0, "Business Group")
    createHeaderCellDefaultStyle(table1Row, 1, "ACCPolicyID")
    createHeaderCellDefaultStyle(table1Row, 2, "Name")
    createHeaderCellDefaultStyle(table1Row, 3, "Creation Date")
    createHeaderCellDefaultStyle(table1Row, 4, "Created By")

    var members = _businessGroups*.Members

    for( table1 in members.orderBy(\elt -> elt.ERBusinessGroup.ID.Value).thenBy(\elt -> elt.ACCPolicyID_ACC)) {
      table1Row = sheet1.createRow(dhRowCount)
      table1Row.createCell(0).setCellValue(table1.ERBusinessGroup.ID.Value)
      table1Row.createCell(1).setCellValue(table1.ACCPolicyID_ACC)
      table1Row.createCell(2).setCellValue(table1.MemberAccountName)
      table1Row.createCell(3).setCellValue(table1.CreateTime)
      table1Row.createCell(4).setCellValue(table1.CreateUser.Credential.UserName)
      dhRowCount += 1
    }
  }
}