package nz.co.acc.gwer.suppressionlists

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.util.PCWebFileUtil
uses gw.api.database.Query
uses gw.pl.persistence.core.Key
uses gw.surepath.suite.integration.logging.StructuredLogger
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.gwer.fileinfo.FileInfoDetails_ACC

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.lob.common.excel.ExcelImporterExporter_ACC
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
class BGSuppressionListController_ACC implements Serializable{
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private static final var ER_SEARCH_RESULT_LIMIT_ACC = "ERSearchResultLimit_ACC"
  private var _suppressionBusinessGroup: Integer[] as SuppressionBusinessGroup = new Integer[]{}
  private var _tooManyRecordsMessage : String as TooManyRecordsMessage = null
  private var _searchCriteria : SuppressionListSearchCriteria_ACC as SearchCriteria = new SuppressionListSearchCriteria_ACC()

  var errors : ArrayList<Integer> = null

  construct() {
  }

//  function loaderForView() {
//    getBusinessGroupSuppressionList()
//  }

//  function getBusinessGroupSuppressionList() {
//
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.ViewBusinessGroupSuppressionList)
//      executeQuery()
//
//      var list = new ArrayList<Integer>()
//      while(rs.next()) {
//        list.add(rs.getInt("BusinessGroupID"))
//      }
//      _suppressionBusinessGroup = list.toArray(new Integer[list.size()]);
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
//  }

//  function removeSuppressionFlagFromBusinessGroup(bgId : Integer)  {
//
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.RemoveBusinessGroupSuppression)
//      stmt.setInt(1, bgId)
//
//      executeStatement()
//
//      var list : List<Integer> = new ArrayList<Integer>(_suppressionBusinessGroup.toList());
//      list.remove(bgId)
//      _suppressionBusinessGroup = list.toTypedArray();
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
//
//    if (errors != null) {
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.RemoveSuppression.Error_ACC", errors.toString()))
//    }
//
//  }

//  function addSuppressionFlagForBusinessGroup(bgId : Integer)  {
//
//
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.AddBusinessGroupSuppression)
//      stmt.setInt(1, bgId)
//
//      executeStatement()
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
//
//    if (errors != null) {
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.RemoveSuppression.Error_ACC", errors.toString()))
//    }
//  }

  function SearchSuppressedERBusinessGroup() : IQueryBeanResult<ERBusinessGroupMember_ACC> {
    var maxSearchResult = ScriptParameters.getParameterValue(ER_SEARCH_RESULT_LIMIT_ACC) as Integer

    var businessGrpMemberQuery = Query.make(ERBusinessGroupMember_ACC)

    var businessGrpQuery = businessGrpMemberQuery.join(ERBusinessGroupMember_ACC#ERBusinessGroup)

    businessGrpQuery.or(\r -> {
      r.compare(ERBusinessGroup_ACC#SuppressGroupLetters, Relop.Equals, Boolean.FALSE)
      r.compare(ERBusinessGroup_ACC#SuppressGroupLetters, Relop.Equals, null)
    })

    if (_searchCriteria.BusinessGroupIdField != null) {
      businessGrpQuery.compare(ERBusinessGroup_ACC#ID, Relop.Equals, new Key(ERBusinessGroup_ACC, _searchCriteria.BusinessGroupIdField))
    }

    if (_searchCriteria.AccPolicyIdField != null) {
      businessGrpMemberQuery.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, _searchCriteria.AccPolicyIdField)
    }

    return businessGrpMemberQuery.select()
  }

  /**
   * 16.10.2018 US12208 NowchoO
   * Function to call BusinessGroupSuppressionListFileInfo Stored Procedure to return CSV file details for Levy Payer Suppression
   * @return FIleInfoDetails_ACC entity
   */
//  function getBusinessGroupSuppressionListFileInfo() : FileInfoDetails_ACC {
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.DownloadSearchBusinessGroupSuppressionList)
//      executeQuery()
//      var list = new ArrayList<FileInfoDetails_ACC>()
//      while(rs.next()) {
//        list.add(new FileInfoDetails_ACC() {
//          :FileChecked = rs.getTimestamp("FileChecked"),
//          :FileGenerated = rs.getTimestamp("FileGenerated"),
//          :SuppressionListFolder = rs.getString("SuppressionListFolder"),
//          :SuppressionListFileName = rs.getString("SuppressionListFilename")
//        })
//      }
//      return list.first()
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
//  }

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

  function setSuppressionFlag(grp : ERBusinessGroup_ACC, suppressFlag : Boolean) {
    var bundle = gw.transaction.Transaction.newBundle()
    var bGroup = bundle.add(grp)
        bGroup.SuppressGroupLetters = suppressFlag
    bundle.commit();
  }

  /**
   * Create a new Search Criteria
   * @return
   */
  function createCriteria(): SuppressionListSearchCriteria_ACC {
    _searchCriteria = new SuppressionListSearchCriteria_ACC()
    return _searchCriteria
  }
}