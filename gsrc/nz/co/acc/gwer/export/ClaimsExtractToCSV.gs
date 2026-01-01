package nz.co.acc.gwer.export

uses gw.api.database.IQueryBeanResult
uses gw.api.web.WebUtil
uses gw.pl.util.csv.CSVBuilder

uses java.io.ByteArrayInputStream
uses java.io.StringWriter

class ClaimsExtractToCSV {

  var _runCalcResult : IQueryBeanResult<ERRunCalcResult_ACC>

  construct(runCalcResult : IQueryBeanResult<ERRunCalcResult_ACC>) {
    _runCalcResult = runCalcResult
  }

  function export(filename : String) {

    if(_runCalcResult.HasElements) {
      var writer = new StringWriter()
      //Build header
      var csvBuilder = new CSVBuilder(writer)
//      _runCalcResult.first().getHeaders().each(\header -> {
//        csvBuilder.add(header)
//      })
//      csvBuilder.newLine()
//
//      //Build contents
//      _runCalcResult.each(\result -> {
//        result.toStringArray().each(\content -> {
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