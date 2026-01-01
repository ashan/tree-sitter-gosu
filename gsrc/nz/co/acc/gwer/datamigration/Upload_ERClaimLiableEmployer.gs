package nz.co.acc.gwer.datamigration

uses nz.co.acc.common.integration.bulkupload.AbstractBulkUploader
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.gwer.upload.parser.ERClaimLiableEmployerUploadParser
uses nz.co.acc.gwer.upload.processor.BulkERClaimLiableEmployerProcessor
uses nz.co.acc.gwer.util.ERProcessUtils_ACC

uses java.io.File
uses java.util.concurrent.Executors

class Upload_ERClaimLiableEmployer {
  private static var _erProcessUtils = new ERProcessUtils_ACC()

  public function UploadERData(csvPath : String, csvFile : String) {
    var executor = Executors.newWorkStealingPool(40)
    var inputFile = new File(csvPath+csvFile)
    var bulkUploader : ERClaimLiableEmployerBulkUploader
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bulkUploader = new ERClaimLiableEmployerBulkUploader(inputFile, inputFile.Name, BulkUploadType_ACC.TC_ERDATAMIGRATION)
    })
    try {
      executor.submit(\-> bulkUploader.run())
    } catch (e : Exception) {
      print("Bulk uploader can not be scheduled for execution: "+e)
    }
    //shutdown ExecutorService
    executor.shutdown();
    while (!executor.isTerminated()) {   }
    System.out.println("Finished all ERClaimLiableEmployer threads");
  }

  class ERClaimLiableEmployerBulkUploader extends AbstractBulkUploader {
    construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
      super(uploadFile, uploadFileName, bulkUploadType)
    }
    override protected function getCSVProcessor(bulkUploadType : BulkUploadType_ACC, updater : BulkUploadProcessUpdater, uploadFile : File) : AbstractCSVProcessor {
      return new BulkERClaimLiableEmployerProcessor(new ERClaimLiableEmployerUploadParser(), updater, uploadFile)
    }
  }
}