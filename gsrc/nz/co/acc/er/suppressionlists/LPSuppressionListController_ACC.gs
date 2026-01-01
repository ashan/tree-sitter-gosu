package nz.co.acc.er.suppressionlists

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.util.PCWebFileUtil
uses gw.plugin.util.CurrentUserUtil
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.er.fileinfo.FileInfoDetails_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.apache.commons.io.FileUtils

uses javax.activation.MimetypesFileTypeMap
uses java.io.ByteArrayInputStream
uses java.io.File
uses java.io.Serializable
uses java.lang.invoke.MethodHandles
uses java.sql.Types

/**
 * Created by andy on 25/09/2017.
 *
 */
class LPSuppressionListController_ACC extends ERDatabaseController_ACC implements Serializable{
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _levyPayerSearchResults: LPSuppressionListSearchResult_ACC[] as LevyPayerSearchResults = new LPSuppressionListSearchResult_ACC[]{}
  private var _tooManyRecordsMessage : String as TooManyRecordsMessage = null
  var errors : ArrayList<Integer> = null

  construct() {
  }

  function loaderForView() {
    getLevyPayerSuppressionList()
  }

  function getLevyPayerSuppressionList() {

    var maxSearchResult = ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer

    _tooManyRecordsMessage = null

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ViewlevyPayerSuppressionList)

      if (_searchCriteria.BusinessGroupIdField == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, _searchCriteria.BusinessGroupIdField)
      }
      if (_searchCriteria.AccPolicyIdField == null) {
        stmt.setNull(2, Types.VARCHAR)
      } else {
        stmt.setString(2, _searchCriteria.AccPolicyIdField)
      }
      if (_searchCriteria.LevyNameField == null) {
        stmt.setNull(3, Types.VARCHAR)
      } else {
        stmt.setString(3, _searchCriteria.LevyNameField)
      }
      stmt.setInt(4, maxSearchResult + 1)
      executeQuery()

      var list = new ArrayList<LPSuppressionListSearchResult_ACC>()
      var count = 0
      while(rs.next()) {
        count++
        if (count <= maxSearchResult) {
          list.add(new LPSuppressionListSearchResult_ACC() {
              :SuppressionListID = rs.getInt("SuppressionListID"),
              :BusinessGroupID = rs.getString("BusinessGroupID"),
              :ACCPolicyID = rs.getString("ACCPolicyID"),
              :LeverPayerName = rs.getString("Name"),
              :RecordCreated = rs.getDate("RecordCreated"),
              :RecordCreatedBy = rs.getString("RecordCreatedBy"),
              :TotalRows = rs.getInt("TotalRows")
              })
        } else {
          _tooManyRecordsMessage = DisplayKey.get("Web.ExperienceRating.SuppressionList.TooManyLevyPayerSearchResult_ACC",
              maxSearchResult)
        }
      }
      _levyPayerSearchResults = list.toArray(new LPSuppressionListSearchResult_ACC[list.size()]);
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

  function removeSuppressionFlagFromLevyPayer(toRemove : LPSuppressionListSearchResult_ACC)  {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RemovelevyPayerSuppression)
      stmt.setInt(1, toRemove.SuppressionListID)

      executeStatement()

      var list : List<LPSuppressionListSearchResult_ACC> = new ArrayList<LPSuppressionListSearchResult_ACC>(_levyPayerSearchResults.toList());
      list.remove(toRemove)
      _levyPayerSearchResults = list.toTypedArray();
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

    if (errors != null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.RemoveSuppression.Error_ACC", errors.toString()))
    }

  }

  function addSuppressionFlagForLevyPayer(levyPayer : LPSuppressionListSearchResult_ACC)  {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.AddlevyPayerSuppression)
      if (levyPayer.LevyPayerID == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, levyPayer.LevyPayerID)
      }
      stmt.setString(2, CurrentUserUtil.getCurrentUser().User.Credential.UserName)
      stmt.registerOutParameter(3, Types.INTEGER)

      executeStatement()

      var result : Integer = stmt.getInt("SuppressionListID")
      _logger.error_ACC(storeProcData.ProcName + " " + result.toString())
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

    if (errors != null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.RemoveSuppression.Error_ACC", errors.toString()))
    }

  }

  function SearchLevyPayerSuppression() : LPSuppressionListSearchResult_ACC[] {

    var maxSearchResult = ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer

    _tooManyRecordsMessage = null

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchLevyPayerSuppression)

      if (_searchCriteria.BusinessGroupIdField == null) {
        stmt.setNull(1, Types.INTEGER)
      } else {
        stmt.setInt(1, _searchCriteria.BusinessGroupIdField)
      }
      if (_searchCriteria.AccPolicyIdField == null) {
        stmt.setNull(2, Types.VARCHAR)
      } else {
        stmt.setString(2, _searchCriteria.AccPolicyIdField)
      }
      if (_searchCriteria.LevyNameField == null) {
        stmt.setNull(3, Types.VARCHAR)
      } else {
        stmt.setString(3, _searchCriteria.LevyNameField)
      }
      stmt.setInt(4, maxSearchResult + 1)
      executeQuery()

      var list = new ArrayList<LPSuppressionListSearchResult_ACC>()
      var count = 0
      while(rs.next()) {
        count++
        if (count <= maxSearchResult) {
          list.add(new LPSuppressionListSearchResult_ACC() {
              :SuppressionListID = rs.getInt("InSuppressionList"),
              :BusinessGroupID = rs.getString("BusinessGroupID"),
              :LevyPayerID = rs.getInt("LevyPayerID"),
              :ACCPolicyID = rs.getString("ACCPolicyID"),
              :LeverPayerName = rs.getString("Name"),
              :TotalRows = rs.getInt("TotalRows")
          })
        } else {
          _tooManyRecordsMessage = DisplayKey.get("Web.ExperienceRating.SuppressionList.TooManyLevyPayerSearchResult_ACC",
                                                  maxSearchResult)
        }
      }
      _levyPayerSearchResults = list.toArray(new LPSuppressionListSearchResult_ACC[list.size()]);
      return _levyPayerSearchResults
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


  /**
   * 16.10.2018 US12122 NowchoO
   * Function to call LevyPayerSuppressionListFileInfo Stored Procedure to return CSV file details for Levy Payer Suppression
   * @return FIleInfoDetails_ACC entity
   */
  function getLevyPayerSuppressionListFileInfo() : FileInfoDetails_ACC {
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.DownloadLevyPayerSuppressionList)
      executeQuery()
      var list = new ArrayList<FileInfoDetails_ACC>()
      while(rs.next()) {
          list.add(new FileInfoDetails_ACC() {
            :FileChecked = rs.getTimestamp("FileChecked"),
            :FileGenerated = rs.getTimestamp("FileGenerated"),
            :SuppressionListFolder = rs.getString("SuppressionListFolder"),
            :SuppressionListFileName = rs.getString("SuppressionListFilename")
          })
      }
      return list.first()
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

  /**
   * 16.10.2018 US12122 NowchoO
   * Function to download SuppressionListFile if it exists
   * @param extractDetail
   */
  function downloadLevyPayerSuppressionListFile(extractDetail : FileInfoDetails_ACC) {
    var extractFile = new File(extractDetail.FilePath)
    if (extractFile.exists()) {
      var exportBytes = FileUtils.readFileToByteArray(extractFile)
      var inputStream = new ByteArrayInputStream(exportBytes)
      var mimeTypeMap = new MimetypesFileTypeMap()
      PCWebFileUtil.copyStreamToClient(mimeTypeMap.getContentType(extractFile), extractDetail.SuppressionListFileName,
          inputStream, exportBytes.Count)
    } else {
      _logger.error_ACC("LPSuppressionListController_ACC.downloadLevyPayerSuppressionListFile Extract File (${extractDetail.FilePath}) does not exist on the server")
      _logger.error_ACC("Extract File (${extractDetail.FilePath}) does not exist on the server")
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ViewSuppression.DownloadSuppressionListFileDoesNotExist_ACC"))
    }
  }

}