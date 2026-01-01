package nz.co.acc.edge.capabilities.monitoring

uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses nz.co.acc.edge.capabilities.monitoring.dto.InboundFileIntegrationStatusDTO_ACC
uses nz.co.acc.integration.util.InboundFileUtil
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty


class InboundFileMonitoringHandler_ACC implements IRpcHandler {

  @InjectableNode
  construct() {
  }

  /**
   * Deletes any "done" IR files and returns counts of all IR inbound files.
   *
   * @return
   */
  @JsonRpcMethod
  function requestIRInboundFileStatus() : InboundFileIntegrationStatusDTO_ACC {
    var inboundFileUtil = new InboundFileUtil(ConfigurationProperty.INBOUND_IR_FILES_FOLDER.PropertyValue)

    // For privacy we must delete all processed IR files.
    inboundFileUtil.deleteDoneFiles()

    var dto = new InboundFileIntegrationStatusDTO_ACC()
    dto.doneFileCount = inboundFileUtil.listDoneFiles().Count
    dto.processingFileCount = inboundFileUtil.listProcessingFiles().Count
    dto.errorFileCount = inboundFileUtil.listErrorFiles().Count
    dto.incomingFileCount = inboundFileUtil.listIncomingFiles().Count
    return dto
  }

  @JsonRpcMethod
  function requestMailhouseInboundFileStatus() : InboundFileIntegrationStatusDTO_ACC {
    var inboundFileUtil = new InboundFileUtil(ConfigurationProperty.MAILHOUSE_INBOUND_DIRECTORY.PropertyValue)

    var dto = new InboundFileIntegrationStatusDTO_ACC()
    dto.doneFileCount = inboundFileUtil.listDoneFiles().Count
    dto.processingFileCount = inboundFileUtil.listProcessingFiles().Count
    dto.errorFileCount = inboundFileUtil.listErrorFiles().Count
    dto.incomingFileCount = inboundFileUtil.listIncomingFiles().Count
    return dto
  }

}