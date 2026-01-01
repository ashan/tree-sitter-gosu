package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses nz.co.acc.plm.integration.ir.stats.IRBatchStats
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper
uses nz.co.acc.plm.integration.ir.util.StubsHelper

uses java.math.BigDecimal
uses java.text.SimpleDateFormat

/**
 * UI helper class for Screen IRInboundAdmin.
 */
class IRInboundAdminUIHelper extends IRUIHelperBase {

  private var _propHelper = new ConstantPropertyHelper()

  private var _selectedBatchId : String as SelectedBatchId = null
  private var _selectedBatchDateFrom : Date as SelectedBatchDateFrom = null
  private var _selectedBatchDateTo : Date as SelectedBatchDateTo = null
  private var _selectedInboundMode : IRInboundMode_ACC as SelectedInboundMode = null
  private var _selectedCompletedFlag : String as SelectedCompletedFlag = _propHelper.FLAG_ALL

  private var _completedFlagOptions : String[]as CompletedFlagOptions = {_propHelper.FLAG_NO,
      _propHelper.FLAG_YES, _propHelper.FLAG_ALL}

  private var _stubHelper : StubsHelper as StubHelper
  private var _searchResult : IQueryBeanResult<IRInboundBatch_ACC> as SearchResult

  private var _totalEarnings : BigDecimal as TotalEarnings

  private var _dateFormat_dMYHms = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_dMYHms)

  private var _defaultSearch_UseNumberOfDays = 14
  private var _maximumBatchNumberForAggregationStats = 100
  private var _defaultSearch_AlertBar_doShow : boolean as DefaultSearch_AlertBar_doShow = false
  private var _defaultSearch_AlertBar_UiMsg : String as DefaultSearch_AlertBar_UiMsg
      = "Default search used (no from Date or Batch-ID entered). Showing records from last ${_defaultSearch_UseNumberOfDays} Days"

  /**
   * Constructor
   */
  public construct() {
    doSearch()
    _stubHelper = new StubsHelper()
  }

  /**
   * Search and find batches match the search criteria.
   */
  public function doSearch() {
    _defaultSearch_AlertBar_doShow = false
    _searchResult = null

    var aQuery = Query.make(IRInboundBatch_ACC)
    var orderBy = QuerySelectColumns.path(Paths.make(IRInboundBatch_ACC#CreateTime))

    if (_selectedBatchId != null) {
      if (_selectedBatchId.startsWith(ConstantPropertyHelper.IR_EXTERNAL_KEY_PREFIX)) {
        aQuery.compare(IRInboundBatch_ACC#ExternalKey, Equals, _selectedBatchId)
      } else {
        aQuery.compare(IRInboundBatch_ACC#BatchId, Equals, _selectedBatchId)
      }
    } else {
      validateDates()
      //Build the query
      aQuery.compare(IRInboundBatch_ACC#BatchDate, GreaterThanOrEquals, _selectedBatchDateFrom.trimToMidnight())
          .compare(IRInboundBatch_ACC#BatchDate, LessThanOrEquals, DateUtil.endOfDay(_selectedBatchDateTo))
      if (_selectedCompletedFlag == _propHelper.FLAG_YES) {
        //only want completed batches
        aQuery.compare(IRInboundBatch_ACC#ErrorCount, Relop.Equals, 0)
      } else if (_selectedCompletedFlag == _propHelper.FLAG_NO) {
        aQuery.compare(IRInboundBatch_ACC#ErrorCount, Relop.GreaterThan, 0)
      }
      if (_selectedInboundMode != null) {
        //only want selected mode
        aQuery.compare(IRInboundBatch_ACC#IRInboundMode_ACC, Equals, _selectedInboundMode)
      }
    }
    _searchResult = aQuery.select().orderByDescending(orderBy) as IQueryBeanResult<IRInboundBatch_ACC>
    recalSumValues()
  }

  /**
   * calculate the sum value displan in the footer
   */
  private function recalSumValues() {
    _totalEarnings = BigDecimal.ZERO
    _searchResult.each(\b -> {
      if (b.GrossEarnings != null) {
        _totalEarnings = _totalEarnings.add(b.GrossEarnings.Amount)
      }
    })
  }

  /**
   * Make sure we always has search dates
   */
  private function validateDates() {
    if (_selectedBatchDateTo == null) {
      _selectedBatchDateTo = DateUtil.currentDate()
    }
    if (_selectedBatchDateFrom == null) {
      _defaultSearch_AlertBar_doShow = true
      _selectedBatchDateFrom = DateUtil.currentDate().trimToMidnight().addDays(_defaultSearch_UseNumberOfDays * -1)
    }
  }

  /**
   * Clear search critiera
   */
  public function clearSearchCriteria() {
    _selectedBatchDateFrom = null
    _selectedBatchDateTo = null
    _selectedInboundMode = null
    _selectedCompletedFlag = _propHelper.FLAG_ALL
  }

  /**
   * Recalculate the status for the given batch
   */
  public function reloadStats(batch : IRInboundBatch_ACC) {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      batch = b.add(batch)
      var batchStatus = new IRBatchStats(batch)
      batchStatus.IRBatch = batch
      batchStatus.rebuildStats()
    })
    recalSumValues()
  }

  /**
   * Reload stats label
   */
  public function deriveReloadStatsLable(aBatch : IRInboundBatch_ACC) : String {
    if (aBatch.StatsUpdatedTimestamp == null) {
      return "ReloadStats"
    } else {
      return "ReloadStats(${_dateFormat_dMYHms.format(aBatch.StatsUpdatedTimestamp)})"
    }
  }

  /**
   * Reload stats label
   */
  public function deriveReloadStatsIcon(aBatch : IRInboundBatch_ACC) : String {
    if (aBatch.StatsUpdatedTimestamp == null) {
      return "new.png"
    } else {
      return "re-run.png"
    }
  }

  /**
   * Get the icon to show if the IR batch is completed
   */
  public function getIcon(batch : IRInboundBatch_ACC) : String {
    if (batch.Status == IRInboundBatchStatus_ACC.TC_LOADED) {
      return "profiler_green.png"
    } else if (batch.Status == IRInboundBatchStatus_ACC.TC_FAILED) {
      return "profiler_red.png"
    } else {
      // loading
      return "profiler_red.png"
    }
  }

}