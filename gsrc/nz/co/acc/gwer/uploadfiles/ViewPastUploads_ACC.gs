package nz.co.acc.gwer.uploadfiles

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

class ViewPastUploads_ACC {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  construct() { }

  property get FileUploadDetails() : IQueryBeanResult<BulkUploadProcess_ACC> {
    return Query.make(BulkUploadProcess_ACC)
                .compareIn(BulkUploadProcess_ACC#uploadType, BulkUploadType_ACC.TF_ERTYPES.TypeKeys.toTypedArray())
                .select()
  }

}