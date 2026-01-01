package nz.co.acc.gwer.export

uses gw.api.database.IQueryBeanResult
uses gw.api.web.WebUtil
uses gw.pl.util.csv.CSVBuilder

uses java.io.ByteArrayInputStream
uses java.io.StringWriter

class SuppressedLevyPayerToCSV {

  var _lvyPyrsAccs : IQueryBeanResult<ERSuppressionList_ACC>

  construct(lvyPyrsAccs : IQueryBeanResult<ERSuppressionList_ACC>) {
    _lvyPyrsAccs = lvyPyrsAccs
  }

  function export(filename : String) {
    if(_lvyPyrsAccs.HasElements) {
      var writer = new StringWriter()
      //Build header
      var csvBuilder = new CSVBuilder(writer)
//      _lvyPyrsAccs.first().getHeaders().each(\header -> {
//        csvBuilder.add(header)
//      })
//      csvBuilder.newLine()
//
//      //Build contents
//      _lvyPyrsAccs.each(\member -> {
//        member.toStringArray().each(\content -> {
//          csvBuilder.add(content)
//        })
//        csvBuilder.newLine()
//      })

      var value = writer.toString().Bytes
      var input = new ByteArrayInputStream(value)
      WebUtil.copyStreamToClient("application/csv", filename, input, value.length)
    }
  }
}