package nz.co.acc.integration.instruction.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses gw.api.util.DisplayableException
uses gw.api.web.WebFile
uses nz.co.acc.common.integration.bulkupload.BulkUploaderUIHelper
uses nz.co.acc.integration.instruction.loader.InstructionFileLoader

uses java.util.concurrent.Executors

/**
 * UI helper class for Screen [InstructionList_ACC].
 */
class InstructionFilesUIHelper {
  private static var executor = Executors.newWorkStealingPool(3)

  private var _searchResult : IQueryBeanResult<InstructionFile_ACC> as SearchResult
  private var _selectedFile : WebFile as SelectedFile
  private var _selectedInstructionType : InstructionType_ACC as SelectedInstructionType
  private var _searchDateFrom : Date as SearchDateFrom
  private var _searchDateTo : Date as SearchDateTo

  final static var MAX_ERROR_LENGTH = 120

  /**
   * Constructor - A default search will be performed..
   */
  public construct() {
    _searchDateFrom = DateUtil.currentDate().trimToMidnight().addDays(-14)
    _searchDateTo = DateUtil.currentDate()
    doSearch()
  }

  /**
   * Search and find batches match the search criteria.
   */
  final public function doSearch() {
    _searchResult = null

    if (_searchDateFrom == null) {
      _searchDateFrom = DateUtil.currentDate().trimToMidnight().addDays(-14)
    }

    if (_searchDateTo == null) {
      _searchDateTo = DateUtil.currentDate()
    }

    var startDate = new Calendar.Builder()
        .setDate(_searchDateFrom.YearOfDate, _searchDateFrom.MonthOfYear - 1, _searchDateFrom.DayOfMonth)
        .setTimeOfDay(0, 0, 0)
        .build().getTime()

    var endDate = new Calendar.Builder()
        .setDate(_searchDateTo.YearOfDate, _searchDateTo.MonthOfYear - 1, _searchDateTo.DayOfMonth)
        .setTimeOfDay(23, 59, 59)
        .build().getTime()

    var query = Query.make(InstructionFile_ACC)
    query.compare(InstructionFile_ACC#CreateTime, Relop.GreaterThanOrEquals, startDate)
    query.compare(InstructionFile_ACC#CreateTime, Relop.LessThanOrEquals, endDate)
    if (_selectedInstructionType != null) {
      query.compare(InstructionFile_ACC#InstructionType_ACC, Relop.Equals, _selectedInstructionType)
    }
    var orderBy = QuerySelectColumns.path(Paths.make(InstructionFile_ACC#CreateTime))
    _searchResult = query.select().orderByDescending(orderBy) as IQueryBeanResult<InstructionFile_ACC>
  }

  public function getBulkUpdateTypeCodes() : List<InstructionType_ACC> {
    return InstructionType_ACC.getTypeKeys(false).where(\tk ->
        tk.isMappedToTypekey_ACC(InstTypeCategory_ACC.TC_BULKUPDATE))
  }

  public function getBulkUpdateTypeCodesV2() : List<InstructionType_ACC> {
    return InstructionType_ACC.getTypeKeys(false).where(\tk ->
        tk.isMappedToTypekey_ACC(InstTypeCategory_ACC.TC_BULKUPDATE)
            and tk.isMappedToTypekey_ACC(InstTypeCategory_ACC.TC_INSTRUCTIONTYPEV2))
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

  public function executeBulkUpload() {
    if (_selectedFile == null) {
      return
    }
    if (!(_selectedFile.Name.endsWithIgnoreCase(".txt") || _selectedFile.Name.endsWithIgnoreCase(".csv"))) {
      throw new DisplayableException("File type must be .txt or .csv")
    }

    var tmpFile = new BulkUploaderUIHelper().copyWebFileToFile(_selectedFile)

    var instructionFileLoader = new InstructionFileLoader(tmpFile, _selectedFile.Name, _selectedInstructionType, User.util.CurrentUser)

    try {
      executor.submit(\-> instructionFileLoader.importFromCSV())
    } catch (e : Exception) {
      throw new DisplayableException("Bulk uploader can not be scheduled for execution", e)
    }
  }
}