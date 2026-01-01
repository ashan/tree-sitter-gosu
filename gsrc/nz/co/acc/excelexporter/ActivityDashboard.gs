package nz.co.acc.excelexporter

uses gw.api.locale.DisplayKey
uses nz.co.acc.common.excelexporter.ExcelExporter
uses org.apache.poi.ss.usermodel.FillPatternType
uses org.apache.poi.ss.usermodel.IndexedColors
uses org.apache.poi.xssf.usermodel.XSSFCellStyle
uses org.apache.poi.xssf.usermodel.XSSFColor

uses java.awt.*

/**
 * Created by Franklin Manubag on 3/6/2020.
 */
class ActivityDashboard extends ExcelExporter {
  var _dashboardHistory : DashboardHistory_ACC[]

  construct(dashboardHistory : DashboardHistory_ACC[]) {
    _dashboardHistory = dashboardHistory
  }

  function getColorFromSLA(slaColor : SLAColor_ACC) : XSSFCellStyle {
    var style = this.WorkBook.createCellStyle()
    if(slaColor == SLAColor_ACC.TC_AMBER) {
      var amberColor = new XSSFColor(new Color(255,191,0), null)
      style.setFillForegroundColor(amberColor)
    } else if(slaColor == SLAColor_ACC.TC_GREEN) {
      style.setFillForegroundColor(IndexedColors.GREEN.getIndex())
    } else {
      style.setFillForegroundColor(IndexedColors.RED.getIndex())
    }

    style.setFillPattern(FillPatternType.SOLID_FOREGROUND)
    return style
  }

  override function writeDataToWorkSheet() {
    var sheet1 = addWorksheet("Activity Dashboard")
    var dhRowCount = 1

    var table1Row = sheet1.createRow(0)
    createHeaderCellDefaultStyle(table1Row, 0, DisplayKey.get("Web.Team.Activities.Dashboard.CreateDate"))
    createHeaderCellDefaultStyle(table1Row, 1, DisplayKey.get("Web.Team.Activities.Dashboard.SLA"))
    createHeaderCellDefaultStyle(table1Row, 2, DisplayKey.get("Web.Team.Activities.Dashboard.Group"))
    createHeaderCellDefaultStyle(table1Row, 3, DisplayKey.get("Web.Team.Activities.Dashboard.JunoWork"))
    createHeaderCellDefaultStyle(table1Row, 4, DisplayKey.get("Web.Team.Activities.Dashboard.Untouched"))
    createHeaderCellDefaultStyle(table1Row, 5, DisplayKey.get("Web.Team.Activities.Dashboard.OldestDate"))
    createHeaderCellDefaultStyle(table1Row, 6, DisplayKey.get("Web.Team.Activities.Dashboard.Completed"))
    createHeaderCellDefaultStyle(table1Row, 7, DisplayKey.get("Web.Team.Activities.Dashboard.DateMoved"))
    createHeaderCellDefaultStyle(table1Row, 8, DisplayKey.get("Web.Team.Activities.Dashboard.ReceivedToday"))

    for( table1 in _dashboardHistory.orderBy(\elt -> elt.GroupName +"-" + elt.JunoWork)) {
      table1Row = sheet1.createRow(dhRowCount)
      table1Row.createCell(0).setCellValue(table1.ExtractDate.toISODate())
      table1Row.createCell(1).setCellStyle(getColorFromSLA(table1.SLA_Color))
      table1Row.createCell(2).setCellValue(table1.GroupName)
      table1Row.createCell(3).setCellValue(table1.JunoWork)
      table1Row.createCell(4).setCellValue(table1.Untouched)
      table1Row.createCell(5).setCellValue(table1.OldestDate)
      table1Row.createCell(6).setCellValue(table1.Completed)
      table1Row.createCell(7).setCellValue(table1.DateMoved)
      table1Row.createCell(8).setCellValue(table1.ReceivedToday)
      dhRowCount += 1
    }
  }
}