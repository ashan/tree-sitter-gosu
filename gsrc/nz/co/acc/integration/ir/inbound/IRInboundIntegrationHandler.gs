package nz.co.acc.integration.ir.inbound

uses gw.api.system.PCLoggerCategory
uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin
uses nz.co.acc.integration.ir.inbound.transformer.CARAFile
uses nz.co.acc.integration.ir.inbound.transformer.CREGFile
uses nz.co.acc.integration.ir.inbound.transformer.InboundIRUtil
uses nz.co.acc.integration.util.InboundFileUtil
uses nz.co.acc.integration.util.InboundIntegrationHelper
uses nz.co.acc.integration.util.WorkQueueUtil
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

uses java.nio.file.Path

class IRInboundIntegrationHandler implements InboundIntegrationHandlerPlugin {
  final var LOGGER = PCLoggerCategory.INTEGRATION_FILE

  override function process(fileItem : Object) {
    var filePath = fileItem as Path
    LOGGER.info("Processing file '${filePath}'")

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      loadIRFile(filePath)
    })

    InboundIntegrationHelper.startWorkQueueIfAllFilesProcessed(
        filePath,
        ConfigurationProperty.INBOUND_IR_FILES_FOLDER.PropertyValue,
        BatchProcessType.TC_IRINBOUNDRECORDS_ACC)
  }

  private function loadIRFile(filePath : Path) {
    var loader = new IRInboundFileLoader()
    var file = filePath.toFile()
    var fileType = InboundIRUtil.determineFileType(file)
    LOGGER.info("Processing IR inbound file '${filePath}' of type '${fileType}'")

    if (fileType == IRInboundFeedType_ACC.TC_REGISTRATIONS) {
      var cregFile = new CREGFile(file)
      loader.loadIRFile(cregFile)
    } else {
      var caraFile = new CARAFile(file)
      loader.loadIRFile(caraFile)
    }
  }

}