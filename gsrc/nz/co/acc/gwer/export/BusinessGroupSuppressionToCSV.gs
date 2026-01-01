package nz.co.acc.gwer.export

uses gw.api.database.IQueryBeanResult
uses nz.co.acc.common.excelexporter.ExcelExporter

uses java.io.ByteArrayInputStream
uses java.io.ByteArrayOutputStream
uses java.io.StringWriter
uses gw.api.web.WebUtil
uses gw.pl.util.csv.CSVBuilder

class BusinessGroupSuppressionToCSV {

  var _businessGroups : IQueryBeanResult<ERBusinessGroup_ACC>

  construct(businessGroups : IQueryBeanResult<ERBusinessGroup_ACC>) {
    _businessGroups = businessGroups
  }

  function export(filename : String) {
    var members = _businessGroups*.Members

    if(members.HasElements) {
      var writer = new StringWriter()
      //Build header
      var csvBuilder = new CSVBuilder(writer)
      members.first().Headers.each(\header -> csvBuilder.add(header))
      csvBuilder.newLine()

      //Build contents
      members.each(\member -> {
        member.toStringArray().each(\content -> csvBuilder.add(content))
        csvBuilder.newLine()
      })

      var value = writer.toString().Bytes
      var input = new ByteArrayInputStream(value)
      WebUtil.copyStreamToClient("application/csv", filename, input, value.length)
    }
  }
}