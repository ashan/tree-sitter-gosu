package nz.co.acc.integration.instruction.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.entity.TypeKey
uses nz.co.acc.plm.integration.ir.ui.IRUIHelperBase

/**
 * Created by Rajasekar on 24/02/2021.
 * Simplified Instruction Record search
 */
class InstructionRecordsSearchHelper extends IRUIHelperBase {
  final static var MAX_ERROR_LENGTH = 120
  private var _searchResult : IQueryBeanResult<InstructionRecord_ACC>as SearchResult

  //Search criteria
  private var _searchTK : TypeKey as SearchTK
  private var _searchKeyword : String as SearchKeyword
  private var _searchKeywordName : String as SearchKeywordName
  private var _searchCriteria:InstructionRecordsSearchCriteria_ACC as crietia
  private var _instruction : InstructionRecord_ACC as SelectedInstructionRecord

  /**
   * Constructor - A default search will be performed..
   */
  public construct() {

  }

  /**
   * Search and find records match the search criteria.
   */
  public function doSearch() {
    _searchResult = null
    var aQuery = Query.make(InstructionRecord_ACC)
    var orderBy = QuerySelectColumns.path(Paths.make(InstructionRecord_ACC#CreateTime))
    _searchResult = aQuery.select().orderByDescending(orderBy) as IQueryBeanResult<InstructionRecord_ACC>
  }

  public static function isProcessedStatus(status : InstructionRecordStatus_ACC) : Boolean {
    return status == InstructionRecordStatus_ACC.TC_PROCESSED
  }

  public static function isSkippedStatus(status : InstructionRecordStatus_ACC) : Boolean {
    return status == InstructionRecordStatus_ACC.TC_SKIPPED
  }

  public static function isCompletedStatus(status : InstructionRecordStatus_ACC) : Boolean {
    return isProcessedStatus(status) or isSkippedStatus(status)
  }

  public function shortenErrorMessage(message : String) : String {
    if (message == null) {
      return null
    } else {
      return message
          .truncate(MAX_ERROR_LENGTH)
          .replaceAll('\n', ' ')
          .replaceAll('\r', '')
    }
  }
}