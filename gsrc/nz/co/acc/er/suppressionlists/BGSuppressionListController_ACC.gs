package nz.co.acc.er.suppressionlists

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.util.PCWebFileUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
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
class BGSuppressionListController_ACC extends ERDatabaseController_ACC implements Serializable{
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _suppressionBusinessGroup: Integer[] as SuppressionBusinessGroup = new Integer[]{}
  private var _tooManyRecordsMessage : String as TooManyRecordsMessage = null
  var errors : ArrayList<Integer> = null

  construct() {
  }

  function loaderForView() {
    getBusinessGroupSuppressionList()
  }

  function getBusinessGroupSuppressionList() {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ViewBusinessGroupSuppressionList)
      executeQuery()

      var list = new ArrayList<Integer>()
      while(rs.next()) {
        list.add(rs.getInt("BusinessGroupID"))
      }
      _suppressionBusinessGroup = list.toArray(new Integer[list.size()]);
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

  function removeSuppressionFlagFromBusinessGroup(bgId : Integer)  {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RemoveBusinessGroupSuppression)
      stmt.setInt(1, bgId)

      executeStatement()

      var list : List<Integer> = new ArrayList<Integer>(_suppressionBusinessGroup.toList());
      list.remove(bgId)
      _suppressionBusinessGroup = list.toTypedArray();
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

  function addSuppressionFlagForBusinessGroup(bgId : Integer)  {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.AddBusinessGroupSuppression)
      stmt.setInt(1, bgId)

      executeStatement()
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

  function SearchBusinessGroupSuppression() : BGSuppressionListSearchResult_ACC[] {

    var maxSearchResult = ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer

    _tooManyRecordsMessage = null

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchBusinessGroupSuppression)

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

      var list = new ArrayList<BGSuppressionListSearchResult_ACC>()
      var count = 0
      while(rs.next()) {
        count++
        if (count <= maxSearchResult) {
          list.add(new BGSuppressionListSearchResult_ACC() {
            :BusinessGroupID = rs.getInt("BusinessGroupID"),
            :LevyPayerID = rs.getInt("LevyPayerID"),
            :ACCPolicyID = rs.getString("ACCPolicyID"),
            :Name = rs.getString("Name"),
            :SuppressGroupLetters = rs.getBoolean("Suppress"),
            :TotalRows = rs.getInt("TotalRows")
          })
        } else {
          _tooManyRecordsMessage = DisplayKey.get("Web.ExperienceRating.SuppressionList.TooManyBusinessGroupSearchResult_ACC",
                                                  maxSearchResult)
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


  /**
   * 16.10.2018 US12208 NowchoO
   * Function to call BusinessGroupSuppressionListFileInfo Stored Procedure to return CSV file details for Levy Payer Suppression
   * @return FIleInfoDetails_ACC entity
   */
  function getBusinessGroupSuppressionListFileInfo() : FileInfoDetails_ACC {
    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.DownloadSearchBusinessGroupSuppressionList)
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
   * 16.10.2018 US12208 NowchoO
   * Function to download SuppressionListFile if it exists
   * @param extractDetail
   */
  function downloadBusinessGroupSuppressionListFile(extractDetail : FileInfoDetails_ACC) {
    var extractFile = new File(extractDetail.FilePath)
    if (extractFile.exists()) {
      var exportBytes = FileUtils.readFileToByteArray(extractFile)
      var inputStream = new ByteArrayInputStream(exportBytes)
      var mimeTypeMap = new MimetypesFileTypeMap()
      PCWebFileUtil.copyStreamToClient(mimeTypeMap.getContentType(extractFile), extractDetail.SuppressionListFileName,
          inputStream, exportBytes.Count)
    } else {
      _logger.error_ACC("BGSuppressionListController_ACC.downloadBusinessGroupSuppressionListFile Extract File (${extractDetail.FilePath}) does not exist on the server")
      _logger.error_ACC("Extract File (${extractDetail.FilePath}) does not exist on the server")
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.ViewSuppression.DownloadSuppressionListFileDoesNotExist_ACC"))
    }
  }
}