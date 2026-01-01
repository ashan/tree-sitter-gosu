package nz.co.acc.er.runinfo

uses gw.api.locale.DisplayKey
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.api.web.util.PCWebFileUtil
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.er.request.ERRetrieveFileType_ACC
uses nz.co.acc.er.uploadfiles.ParamFileTypes_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.commons.io.FileUtils

uses javax.activation.MimetypesFileTypeMap
uses java.io.ByteArrayInputStream
uses java.io.File
uses java.lang.invoke.MethodHandles
uses java.sql.Timestamp
uses java.sql.Types

class RunInfoController_ACC extends ERDatabaseController_ACC {

  private var _successMessage : String as SuccessMessage = null
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  property get retriveAllRunInformation() : RunInfoDetails_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ViewRunInformation)
      executeQuery()

      var list = new ArrayList<RunInfoDetails_ACC>()
      while(rs.next()) {
        list.add(new RunInfoDetails_ACC(){
          :RunID = rs.getLong("RunID"),
          :RequestTypeID = rs.getLong("RequestTypeID"),
          :RequestTypeDesc = rs.getString("RequestTypeDescription"),
          :RunDateTime = new Date(rs.getTimestamp("RunDateTime").getTime()),
          :RequestID = rs.getLong("RequestID"),
          :RecordCreated = new Date(rs.getTimestamp("RecordCreated").getTime()),
          :RecordCreatedBy = rs.getString("RecordCreatedBy"),
          :RunStatus = rs.getString("RunStatus"),
          :TotalResults = rs.getLong("TotalResults"),
          :RequiresManualCalc = rs.getLong("RequiresManualCalc"),
          :PendingManualCalc = rs.getLong("PendingManualCalc"),
          :ExtractID = rs.getLong("ExtractID"),
          :ExtractStatus = rs.getString("ExtractStatus")
        })
      }
      return list.toTypedArray()
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
  }

  function getExtractStatusDesc(runInfoDetail : RunInfoDetails_ACC) : String {
    if (runInfoDetail.RunStatus == RunStatus_ACC.Completed.Desc and
        runInfoDetail.ExtractStatus != null and runInfoDetail.ExtractStatus != RunExtractStatus_ACC.Completed.Desc) {
      if (runInfoDetail.ExtractStatus == RunExtractStatus_ACC.Pending.Desc or
          runInfoDetail.ExtractStatus == RunExtractStatus_ACC.InProgress.Desc) {
        return DisplayKey.get("Web.ExperienceRating.RunInformation.ExtractStatusInProgressDesc_ACC")
      }
      if (runInfoDetail.ExtractStatus == RunExtractStatus_ACC.Failed.Desc) {
        return DisplayKey.get("Web.ExperienceRating.RunInformation.ExtractStatusFailedDesc_ACC")
      }
      if (runInfoDetail.ExtractStatus == RunExtractStatus_ACC.Outdated.Desc) {
        return DisplayKey.get("Web.ExperienceRating.RunInformation.ExtractStatusOutdatedDesc_ACC")
      }
    }
    return null
  }

  function getExtractLinkDesc(extractStatus : String) : String {
    if (extractStatus == null) {
      return DisplayKey.get("Web.ExperienceRating.RunInformation.ExtractLinkRequestDesc_ACC")
    } else if (extractStatus == RunExtractStatus_ACC.Failed.Desc or
               extractStatus == RunExtractStatus_ACC.Outdated.Desc) {
      return DisplayKey.get("Web.ExperienceRating.RunInformation.ExtractLinkRequestAgainDesc_ACC")
    }
    return null
  }

  function isExtractRequestLinkAvailable(runInfoDetail : RunInfoDetails_ACC) : boolean {
    return runInfoDetail.RunStatus == RunStatus_ACC.Completed.Desc and
           (runInfoDetail.ExtractStatus == null or
            runInfoDetail.ExtractStatus == RunExtractStatus_ACC.Failed.Desc or
            runInfoDetail.ExtractStatus == RunExtractStatus_ACC.Outdated.Desc) and
           perm.System.requestrunextractacc
  }

  function isExtractDownloadLinkAvailable(runInfoDetail : RunInfoDetails_ACC) : boolean {
    return runInfoDetail.RunStatus == RunStatus_ACC.Completed.Desc and
           runInfoDetail.ExtractStatus == RunExtractStatus_ACC.Completed.Desc and
           perm.System.downloadrunextractacc
  }

  function generateERExtractRequest(runID : Long) {

    _successMessage = null

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ERRunAddERExtract)
      stmt.setLong(1, runID)
      stmt.setString(2, "Pending")
      stmt.setTimestamp(3, new Timestamp(DateUtil.currentDate().getTime()))
      stmt.setString(4, User.util.CurrentUser.Credential.UserName)
      if (User.util.CurrentUser.Contact.EmailAddress1 != null) {
        stmt.setString(5, User.util.CurrentUser.Contact.EmailAddress1)
      } else {
        stmt.setNull(5, Types.VARCHAR)
      }
      stmt.execute()
      _successMessage = DisplayKey.get("Web.ExperienceRating.RunInformation.GenerateERExtractSuccessMessage_ACC")
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
  }

  function retrieveExtractDetails(extractID : Long) : RunExtractDetails_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ViewExtractDetails)
      stmt.setLong(1, extractID)
      rs = stmt.executeQuery()
      var list = new ArrayList<RunExtractDetails_ACC>()
      var filetypes : ParamFileTypes_ACC = new ERRetrieveFileType_ACC().retrieveAllFileTypes()
      var ext : String = filetypes.getExtensionsFromName("ERRunExtract")
      while(rs.next()) {

        var baseFilename : String = rs.getString("FileName")
        var fileParts : int = rs.getInt("FileParts")
        var baseExtractID : long = rs.getLong("ExtractID")
        var baseExtractTargetFolder = rs.getString("ExtractTargetFolder")

        for (var i in 1..fileParts) {
          var fullFilename : String = baseFilename + "_" + i + "." + ext
          list.add(new RunExtractDetails_ACC() {
              :ExtractID = baseExtractID,
              :ExtractTargetFolder = baseExtractTargetFolder,
              :ExtractFileName = fullFilename
          })
        }

      }
      return list.toTypedArray()
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

  }

  function downloadExtractFile(extractDetail : RunExtractDetails_ACC) {
    var extractFile = new File(extractDetail.FilePath)
    if (extractFile.exists()) {
      var exportBytes = FileUtils.readFileToByteArray(extractFile)
      var inputStream = new ByteArrayInputStream(exportBytes)
      var mimeTypeMap = new MimetypesFileTypeMap()
      PCWebFileUtil.copyStreamToClient(mimeTypeMap.getContentType(extractFile), extractDetail.ExtractFileName,
                                       inputStream, exportBytes.Count)
    } else {
      _logger.error_ACC("RunInfoController_ACC.downloadExtractFile Extract File (${extractDetail.FilePath}) does not exist on the server")
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.RunInformation.ExtractFileDoesNotExist_ACC"))
    }
  }

}