package nz.co.acc.plm.integration.ir.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.web.WebFile
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.ir.schedule.IRScheduleValidator
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

uses java.text.SimpleDateFormat

/**
 * UI helper class for screen {@code IRScheduleAdmin_ACC.pcf}.
 */
class IRScheduleAdminUIHelper extends IRUIHelperBase {

  private var _selectedYear: Integer
  private var _searchResult: IQueryBeanResult<IRSchedule_ACC>as SearchResult
  private var _selectedScheduleFile: WebFile as SelectedScheduleFile = null

  /**
   * Constructor
   */
  public construct() {
    if (_selectedYear == null) {
      _selectedYear = Date.CurrentDate.Calendar.CalendarYear
    }
    doSearch()
  }

  /**
   * Getter for SelectedYear
   */
  public property get SelectedYear(): Integer {
    return _selectedYear
  }

  /**
   * Setter for SelectedYear
   */
  public property set SelectedYear(year: Integer) {
    _selectedYear = year
    doSearch()
  }

  /**
   * Search sequencer by criteria
   */
  public function doSearch() {
    _searchResult = null
    var aQuery = Query.make(IRSchedule_ACC)
    var orderByRunDate = QuerySelectColumns.path(Paths.make(IRSchedule_ACC#RunDate))

    var dateFormat = new SimpleDateFormat(ConstantPropertyHelper.DATE_FORMAT_dMYHms)

    var startDate = dateFormat.parse("01/01/${_selectedYear} 00:00:00")
    var endDate = dateFormat.parse("31/12/${_selectedYear} 23:59:59")

    aQuery.compare(IRSchedule_ACC#RunDate, Relop.LessThanOrEquals, endDate)
    aQuery.compare(IRSchedule_ACC#RunDate, Relop.GreaterThanOrEquals, startDate)

    _searchResult = aQuery.select().orderBy(orderByRunDate) as IQueryBeanResult<IRSchedule_ACC>
  }

  /**
   * Upload selected schedule for IR
   */
  public function uploadSchedule() {
    var uploader = new IRScheduleUploader()
    uploader.importFromCSV(SelectedScheduleFile)
  }

  /**
   * Create new schedule
   */
  public function createNewSchedule(): IRSchedule_ACC {
    var newSchedule = new IRSchedule_ACC()
    return newSchedule
  }

  /**
   * Verify updated schedules
   *
   * @param bundle
   */
  public function validateSchedules(bundle: Bundle) {
    var validator = new IRScheduleValidator(_selectedYear)
    validator.validateAndCommit(bundle)
  }

}



