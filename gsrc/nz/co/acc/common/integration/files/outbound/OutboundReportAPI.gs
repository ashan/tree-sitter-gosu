package nz.co.acc.common.integration.files.outbound

uses gw.util.StreamUtil

uses java.nio.file.FileSystems
uses java.nio.file.Files
uses java.nio.file.StandardOpenOption
uses java.text.DecimalFormat
uses java.util.regex.Matcher
uses java.util.regex.Pattern

/**
 * Created by fabianr on 8/06/2017.
 */
class OutboundReportAPI {

  public function createReport(outboundHeader: OutBoundHeader_ACC, reportTemplate: String, location: String) {
    if (outboundHeader != null) {
      if (reportTemplate != null) {
        var contextObjects = new java.util.HashMap()
        var totalAmt = outboundHeader.TotalAmount.toNumber()
        var amount = Double.parseDouble(totalAmt.toString());
        var formatter = new DecimalFormat("#,###.##");
        contextObjects.put("newAmount", formatter.format(amount))
        contextObjects.put("OutboundHeader", outboundHeader)
        var templatePlugin = gw.plugin.Plugins.get(gw.plugin.document.IDocumentTemplateSource)
        var template = templatePlugin.getDocumentTemplate(reportTemplate, gw.api.util.LocaleUtil.getCurrentLocale())
        var filename = outboundHeader.FileName.replaceFirst(Pattern.compile("(.txt|.csv)") + "$", Matcher.quoteReplacement(".doc"))
        gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
          var document = new Document()
          document.Name = outboundHeader.FileName
          document.MimeType = "application/msword"
          var doc = gw.document.DocumentProduction.createDocumentSynchronously(template, contextObjects, document)
          var buffer = StreamUtil.getContent(doc.InputStream)
          var targetFile = FileSystems.getDefault().getPath(location, {filename})
          var outStream = Files.newOutputStream(targetFile, {StandardOpenOption.CREATE_NEW})
          outStream.write(buffer)
          outStream.close()
        })
      }
    }

  }


}
