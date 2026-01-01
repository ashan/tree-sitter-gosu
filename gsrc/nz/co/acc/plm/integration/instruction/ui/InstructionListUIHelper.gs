package nz.co.acc.plm.integration.instruction.ui

uses gw.api.admin.WorkflowUtil
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses gw.api.web.WebFile
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.ui.IRInboundAdminUIHelper
uses nz.co.acc.plm.integration.ir.ui.IRUIHelperBase
uses nz.co.acc.plm.integration.ir.util.BundleHelper
uses pcf.InstructionList_ACC

/**
 * UI helper class for Screen [InstructionList_ACC].
 */
class InstructionListUIHelper {

  private var _selectedDateFrom : Date as SelectedDateFrom = null
  private var _selectedDateTo : Date as SelectedDateTo = null
  private var _selectedInstructionType : InstructionType_ACC as SelectedInstructionType = null

  private var _searchResult : IQueryBeanResult<Instruction_ACC> as SearchResult

  private var _selectedInstruction : Instruction_ACC as SelectedInstruction

  private var _selectedWorkers : IQueryBeanResult<InstructionWorker_ACC> as SelectedWorkers

  private var _selectedWF : InstructionWF_ACC as SelectedWF

  private var _selectedIRInbound : IRInboundRecord_ACC as SelectedIRInbound

  private var _selectedInstTypeCategory : InstTypeCategory_ACC as SelectedInstTypeCategory

  private var _selectedAccount : Account as SelectedAccount

  private var _selectedLevyYear : Integer as SelectedLevyYear

  private var _incompletedFlag : boolean

  private var _selectedFile: WebFile as SelectedFile = null

  private var _defaultSearch_UseNumberOfDays = 14

  private var _defaultSearch_AlertBar_doShow : boolean as DefaultSearch_AlertBar_doShow = false
  private var _defaultSearch_AlertBar_UiMsg : String as DefaultSearch_AlertBar_UiMsg
      = "Default search used. Showing records from last ${_defaultSearch_UseNumberOfDays} Days"

  /**
   * Constructor - A default search will be performed..
   */
  public construct() {
    this(true)
  }

  /**
   * Constructor
   */
  public construct(doDefaultSearch : boolean) {
    if (doDefaultSearch) {
      doSearch()
    }
  }

  /**
   * DoSearch and find instructions match the search criteria.
   */
  public function doSearch() {
    doSearch(false)
  }

  /**
   * DoSearch and find instructions match the search criteria.
   * @param incompletedFlag
   */
  public function doSearch(incompletedFlag : boolean) {
    _incompletedFlag = incompletedFlag

    _defaultSearch_AlertBar_doShow = false
    _searchResult = null

    setShowDefaultSearchMsgFlag()

    var aQuery = Query.make(Instruction_ACC)
    var orderBy = QuerySelectColumns.path(Paths.make(Instruction_ACC#CreateTime))
    if (_selectedAccount == null) {
      //This search is not account related...
      validateDates()
      aQuery.compare(Instruction_ACC#CreateTime, GreaterThan, _selectedDateFrom.trimToMidnight())
          .compare(Instruction_ACC#CreateTime, LessThan, DateUtil.endOfDay(_selectedDateTo))
      if (_selectedInstructionType != null) {
        aQuery.compare(Instruction_ACC#InstructionType_ACC, Equals, _selectedInstructionType)
      }
    } else {
      //This search is account related...
      aQuery.compare(Instruction_ACC#AccountNumber, Equals, _selectedAccount.AccountNumber)
      if (_selectedLevyYear != null) {
        aQuery.compare(Instruction_ACC#LevyYear, Equals, _selectedLevyYear)
      }
    }
    if (_incompletedFlag) {
      aQuery.or(\orCriteria -> {
        orCriteria.compare(Instruction_ACC#CompletedWorkerCount, NotEquals, aQuery.getColumnRef("TotalWorkerCount"))
        orCriteria.compare(Instruction_ACC#CompletedWorkerCount, Equals, null)})
    }
    _searchResult = aQuery.select().orderByDescending(orderBy) as IQueryBeanResult<Instruction_ACC>

    select(null)
  }

  /**
   * Make sure "_defaultSearch_AlertBar_doShow" is set correctly
   */
  private function setShowDefaultSearchMsgFlag() {
    if (_selectedDateFrom == null
        && _selectedDateTo == null
        && _selectedInstruction == null
        && _selectedAccount == null) {
      _defaultSearch_AlertBar_doShow = true
    }
  }

  /**
   * Make sure we always has search dates
   */
  private function validateDates() {
    if (_selectedDateTo == null) {
      _selectedDateTo = DateUtil.currentDate()
    }
    if (_selectedDateFrom == null) {
      _selectedDateFrom = DateUtil.currentDate().trimToMidnight().addDays(_defaultSearch_UseNumberOfDays*-1)
    }
  }

  /**
   * Select the given instruction
   * @param instruction
   */
  public function select(instruction : Instruction_ACC) {
    if (instruction != null) {
      _selectedInstruction = instruction
      _selectedWF = instruction.InstructionWF
      _selectedIRInbound = instruction.IRInboundRecord

      var orderBy = QuerySelectColumns.path(Paths.make(InstructionWorker_ACC#CreateTime))

      var q = Query.make(InstructionWorker_ACC)
      q.compare(InstructionWorker_ACC#Instruction_ACC, Equals, _selectedInstruction)
      _selectedWorkers = q.select().orderBy(orderBy) as IQueryBeanResult<InstructionWorker_ACC>
    } else {
      _selectedInstruction = null
      _selectedWF = null
      _selectedWorkers = null
      _selectedIRInbound = null
    }
  }

  /**
   * Initialise instruction
   * @param instruction
   */
  public function initInstruction(instruction : Instruction_ACC, bundle : Bundle) {
    if (_selectedFile != null) {
      instruction.WorkerBuilder.importFromCSV(_selectedFile, bundle)
    }
    instruction.buildWorker()
  }

  /**
   * Create instruction with default values
   * @return instruction
   */
  public function createInstruction() : Instruction_ACC {
    var instruction = new Instruction_ACC()
    instruction.IsSynchronous = false
    return instruction
  }

  /**
   * Reload the stats and select the given instruction
   * @param instruction
   */
  public function reloadStats(instruction : Instruction_ACC) {
    var latest : Instruction_ACC
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var edit = BundleHelper.explicitlyAddBeanToBundle(b, instruction, false)
      edit.reloadStats()
      latest = edit
    })
    select(latest)
  }

  /**
   * This is the restricted function controlled by a script parameter. Allows you to skip all the instruction records in error, at once.
   *
   */
  public function skipAllErrors(instruction : Instruction_ACC) {
    instruction.skipAll()
    reloadStats(instruction)
  }

  /**
   * Download runtime messages
   *
   */
  public function downloadRuntimeMessages(instruction : Instruction_ACC) {
    var helper = new WorkerRuntimeMsgHelper(instruction)
    helper.exportErrorMsgs()
  }

  /**
   * Resume the selected workflow
   */
  public function resumeWorkflow() {
    if (isBuilderInError()) {
      WorkflowUtil.resumeWorkflow(_selectedWF)
    }
  }

  /**
   * Resume the selected workflow
   */
  public function skipBuilder() {
    if (isBuilderInError()) {
      gw.transaction.Transaction.runWithNewBundle(\b -> {
        var edit = BundleHelper.explicitlyAddBeanToBundle(b, _selectedInstruction, false)
        edit.Skipped = true
      })
      WorkflowUtil.resumeWorkflow(_selectedWF)
    }
  }

  /**
   * Is select builder workflow in Error?
   * @return True if builer in ERROR state
   */
  public function isBuilderInError() : boolean {
    if ((_selectedWF != null)
        && (_selectedWF.State == WorkflowState.TC_ERROR || _selectedWF.State == WorkflowState.TC_SUSPENDED)) {
      return true
    }
    return false
  }

  /**
   * Goto an account Page
   */
  public function gotoAccount(accNo : String) {
    IRUIHelperBase.gotoAccountDetails(accNo)
  }

  /**
   * Goto the instruction page
   * @param instruction
   */
  public static function gotoInstruction(instruction : Instruction_ACC) {
    var uiHelper = new InstructionListUIHelper()
    uiHelper.SelectedDateFrom = instruction.CreateTime
    uiHelper.SelectedInstructionType = instruction.InstructionType_ACC
    uiHelper.doSearch()
    uiHelper.select(instruction)
    InstructionList_ACC.push(uiHelper)
  }

  /**
   * Skip worker
   * @param InstructionWorker_ACC
   */
  public static function skip(worker : InstructionWorker_ACC) {
    gw.transaction.Transaction.runWithNewBundle(\b -> {
      var edit = BundleHelper.explicitlyAddBeanToBundle(b, worker, false)
      edit.updateStatus(InstructionExecStatus_ACC.TC_SKIPPED)
    })
  }

  /**
   * Build AEP ui helper...
   */
  public static function buildAEPUIHelper(acc : Account) : InstructionListUIHelper {
    var helper = new InstructionListUIHelper(false)
    helper.SelectedInstTypeCategory = InstTypeCategory_ACC.TC_AEP
    helper.SelectedAccount = acc

    helper.doSearch()

    return helper
  }

  /**
   * This is restricted functions, we can skip all the errors
   */
  public function skipAllErrors() {
    var aQuery = Query.make(InstructionWorker_ACC)
    aQuery.compare(InstructionWorker_ACC#InstructionExecStatus_ACC, Equals, InstructionExecStatus_ACC.TC_PROCESSING)
    var list = aQuery.select()
    list.each(\worker -> {
      if (worker.canBeSkipped()) {
        skip(worker)
      }
    })
  }

  /**
   * Return all the instruction type mapped to "BulkUpdate"
   */
  public function getBulkUpdateTypeCodes() : List<InstructionType_ACC> {
    if (_selectedAccount == null) {
      return InstructionType_ACC.getTypeKeys(false)
          .where(\tk -> tk.isMappedToTypekey_ACC(InstTypeCategory_ACC.TC_BULKUPDATE)
            and tk.isMappedToTypekey_ACC(InstTypeCategory_ACC.TC_INSTRUCTIONTYPEV1))
    } else {
      return {InstructionType_ACC.TC_AEPMEMBERMANAGEMENT}
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  // UI display values
  /////////////////////////////////////////////////////////////////////////////////
  /**
   * Do we need to show the common search filter in the screen?
   * Common search filters should only appear for generic screen...
   */
  public function showCommonFilter() : boolean {
    if (SelectedInstTypeCategory == null) {
      return true
    }
    return false
  }

  /**
   * Do we need to show the levy year search filter in the screen?
   * Levy year filter should only appear for AEP screen...
   */
  public function showLevyYearFilter() : boolean {
    if (SelectedAccount != null) {
      return true
    }
    return false
  }

  /**
   * Do we need to show "IsSynchronous" column
   */
  public function showIsSynchronousColumn() : boolean {
    if (SelectedInstTypeCategory == null) {
      return true
    }
    return false
  }

  /**
   * Do we need to show "LevyYear" column
   */
  public function showLevyYearColumn() : boolean {
    if (SelectedAccount != null) {
      return true
    }
    return false
  }

  /**
   * Do we need to show "LevyYear" column
   */
  public function showAccountLink() : boolean {
    if (SelectedAccount == null && SelectedInstruction.AccountNumber != null) {
      return true
    }
    return false
  }

  /**
   * Do we need to show "LevyYear" column
   */
  public function showSkipAllErrors(instruction : Instruction_ACC) : boolean {
    var total = instruction.TotalWorkerCount
    var completed = instruction.CompletedWorkerCount
    if (total != null && completed != null && total != 0 && total != completed) {
      return true
    }
    return false
  }

  /**
   * Get the icon to show if the instruction is completed
   */
  public function getIcon(rec : Instruction_ACC): String {
    if (rec.TotalWorkerCount == rec.CompletedWorkerCount && rec.TotalWorkerCount != null && rec.TotalWorkerCount != 0) {
      return "profiler_green.png"
    } else {
      return "trans_pixel.png"
    }
  }

  /**
   * The ReloadStats Icon
   * @param rec
   * @return The Icon
   */
  public function deriveReloadStatsIcon(rec : Instruction_ACC) : String {
    if (rec.StatsTimestamp == null) {
      return "new.png"
    } else {
      return "re-run.png"
    }
  }

  /**
   * The ReloadStats Label
   * @param rec
   * @return The label
   */
  public function deriveReloadStatsLabel(rec : Instruction_ACC) : String {
    if (rec.StatsTimestamp == null) {
      return "ReloadStats"
    } else {
      return "ReloadStats(${InstructionConstantHelper.DATE_FORMAT_dMYHm.format(rec.StatsTimestamp)})"
    }
  }

  /**
   * Navigate to Inbound Batch...
   */
  public function gotoInboundRecord() {
    if (_selectedIRInbound != null) {
      IRInboundAdminUIHelper.gotoBatchDetails(_selectedIRInbound)
    }
  }

}