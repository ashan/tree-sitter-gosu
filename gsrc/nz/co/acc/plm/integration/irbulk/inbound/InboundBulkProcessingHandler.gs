package nz.co.acc.plm.integration.irbulk.inbound

uses gw.plugin.integration.inbound.InboundIntegrationHandlerPlugin
uses nz.co.acc.plm.integration.bulkupload.BulkUploader

class InboundBulkProcessingHandler implements InboundIntegrationHandlerPlugin {

  override function process(o: Object) {
    var file = o as java.nio.file.Path
    var bulkUploadType = BulkUploadType_ACC.AllTypeKeys.firstWhere(\elt ->
      file.FileName.toString().contains(elt.Code)
    )

    var bulkUploader = new BulkUploader(file.toFile(), file.FileName.toString(), bulkUploadType)
    bulkUploader.IsFTPUploaded = true
    bulkUploader.run()
  }
}