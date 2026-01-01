package nz.co.acc.er.uploadfiles

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

class ViewPastUploads_ACC extends ERDatabaseController_ACC {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  construct() { }

  property get FileUploadDetails() : FileUploadDetails_ACC[] {
    var details = new ArrayList<FileUploadDetails_ACC>()

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ListFileUploads)
      rs = stmt.executeQuery()
      while(rs.next()) {
        details.add(new FileUploadDetails_ACC(){
          :FileName = rs.getString("FileName"),
          :DateUploaded = rs.getTimestamp("RecordCreated"),
          :UploadedBy = rs.getString("RecordCreatedBy"),
          :Comments = rs.getString("Comment"),
          :Status = rs.getString("Status"),
          :FailureReason = rs.getString("FailureReason")
        })
      }
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }

    return details.toTypedArray()
  }

}