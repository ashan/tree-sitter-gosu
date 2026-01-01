package nz.co.acc.gwer.suppressionlists

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.pl.persistence.core.Key
uses gw.api.util.DisplayableException
uses gw.api.web.util.PCWebFileUtil
uses gw.plugin.util.CurrentUserUtil
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.gwer.fileinfo.FileInfoDetails_ACC
uses gw.api.database.Query
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
class LPSuppressionListController_ACC implements Serializable{
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _suppressedLevyPayers : IQueryBeanResult<ERSuppressionList_ACC> as SuppressedLevyPayers
  private var _tooManyRecordsMessage : String as TooManyRecordsMessage = null
  private var _searchCriteria : SuppressionListSearchCriteria_ACC as SearchCriteria = new SuppressionListSearchCriteria_ACC()
  var errors : ArrayList<Integer> = null

  construct() {
  }

  function loaderForView() {
    getLevyPayerSuppressionList()
  }

  function getLevyPayerSuppressionList() : IQueryBeanResult<ERSuppressionList_ACC> {
    var results : IQueryBeanResult<ERBusinessGroupMember_ACC>
    var maxSearchResult = ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer

    _tooManyRecordsMessage = null

    var lvyPyrsQuery = Query.make(ERSuppressionList_ACC)

    if(_searchCriteria.AccPolicyIdField.HasContent) {
      lvyPyrsQuery.compare(ERSuppressionList_ACC#ACCPolicyID, Relop.Equals, _searchCriteria.AccPolicyIdField)
    }

    if(_searchCriteria.BusinessGroupIdField != null) {
      lvyPyrsQuery.join("ACCPolicyID", ERPolicyMemberMap_ACC, "ACCPolicyID")
    }

    _suppressedLevyPayers = lvyPyrsQuery.select()
    return _suppressedLevyPayers
  }

  function getBusinessGroupMemberDetail(accPolicyID : String) : ERBusinessGroupMember_ACC {
    return Query.make(ERBusinessGroupMember_ACC)
        .compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
                .select().FirstResult
  }

  function removeSuppressionFlagFromLevyPayer(toRemove : ERSuppressionList_ACC)  {
    var lpQuery = Query.make(ERSuppressionList_ACC)
        lpQuery.compare(ERSuppressionList_ACC#ACCPolicyID, Relop.Equals, toRemove.ACCPolicyID)
    var result = lpQuery.select().FirstResult

    if(result != null) {
      var bundle = gw.transaction.Transaction.getCurrent()
      var levyPayer = bundle.add(result)
      levyPayer.remove()
      bundle.commit()
    }
  }

  function addSuppressionFlagForLevyPayer(levyPayer : LPSuppressionListSearchResult_ACC)  {
    var lpQuery = Query.make(ERSuppressionList_ACC)
    lpQuery.compare(ERSuppressionList_ACC#ACCPolicyID, Relop.Equals, levyPayer.ACCPolicyID)
    var result = lpQuery.select().FirstResult

    if(result == null) {
      var bundle = gw.transaction.Transaction.getCurrent()
      var newLP = new ERSuppressionList_ACC()
      newLP.ACCPolicyID = levyPayer.ACCPolicyID
      bundle.commit()
    }
  }

  function SearchLevyPayerSuppression() : LPSuppressionListSearchResult_ACC[] {
    var list = new ArrayList<LPSuppressionListSearchResult_ACC>()
    if(!SearchCriteria.AccPolicyIdField.HasContent and SearchCriteria.BusinessGroupIdField == null) {
      throw new DisplayableException("Required fields are empty")
    }
    var bgmQuery = Query.make(ERBusinessGroupMember_ACC)

    if(SearchCriteria.AccPolicyIdField.HasContent) {
      bgmQuery.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, SearchCriteria.AccPolicyIdField)
    }

    if(SearchCriteria.BusinessGroupIdField != null) {
      bgmQuery.compare(ERBusinessGroupMember_ACC#ERBusinessGroup, Relop.Equals, new Key(ERBusinessGroup_ACC, SearchCriteria.BusinessGroupIdField))
    }

    bgmQuery.select().each(\elt -> {
      var nResult = new LPSuppressionListSearchResult_ACC()
      nResult.ACCPolicyID = elt.ACCPolicyID_ACC
      nResult.BusinessGroupID = elt.ERBusinessGroup.ID.Value
      nResult.LeverPayerName = elt.MemberAccountName
      list.add(nResult)
      }
    )

    if(!list.HasElements) {
      var nResult = new LPSuppressionListSearchResult_ACC()
      nResult.ACCPolicyID = SearchCriteria.AccPolicyIdField

      list.add(nResult)
    }

    return list.toTypedArray()
  }


  /**
   * 16.10.2018 US12122 NowchoO
   * Function to call LevyPayerSuppressionListFileInfo Stored Procedure to return CSV file details for Levy Payer Suppression
   *
   * @return FIleInfoDetails_ACC entity
   */
  property get LevyPayerSuppressionListFileInfo() : FileInfoDetails_ACC {
    return null
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

  /**
   * Create a new Search Criteria
   * @return
   */
  function createCriteria(): SuppressionListSearchCriteria_ACC {
    _searchCriteria = new SuppressionListSearchCriteria_ACC()
    return _searchCriteria
  }
}