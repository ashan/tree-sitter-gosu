package nz.co.acc.integration.mailhouse.inbound

uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses nz.co.acc.integration.util.InboundIntegrationHelper
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.nio.file.Path

class MailhouseInboundIntegrationHandler implements InboundIntegrationHandlerPlugin {
  final static var LOG = StructuredLogger_ACC.INTEGRATION_FILE.withClass(MailhouseInboundIntegrationHandler)

  override function process(fileItem : Object) {
    var zipFilePath = fileItem as Path

    var loader = new MailhouseFileLoader()
    loader.process(zipFilePath)

    InboundIntegrationHelper.startWorkQueueIfAllFilesProcessed(
        zipFilePath,
        ConfigurationProperty.MAILHOUSE_INBOUND_DIRECTORY.PropertyValue,
        BatchProcessType.TC_MAILHOUSEDOCUMENTUPLOAD_ACC)
  }

}