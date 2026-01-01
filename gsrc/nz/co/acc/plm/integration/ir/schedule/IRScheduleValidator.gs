package nz.co.acc.plm.integration.ir.schedule

uses com.guidewire.pl.system.exception.DBDuplicateKeyException
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle

/**
 * The validator before commit schedule change.
 */
class IRScheduleValidator {

  /**
   * Maximum number of schedule entries allowed.
   * TODO-KS: Will be converted to a script parameter
   */
  public static final var MAX_SCHEDULE_ENTRIES: int = ScriptParameters.IR_Max_Schedule_Entries_ACC

  /**
   * Year of the schedule
   */
  var _runYear: Integer

  /**
   * Constructor
   */
  public construct(year: Integer) {
    _runYear = year
  }

  /**
   * Validate all the updated schedule
   */
  public function validateAndCommit(bundle: Bundle) {
    if (bundle == null) {
      throw new RuntimeException("No transaction bundle found!")
    }
    if (_runYear == null) {
      throw new DisplayableException("Please specify a Year for the schedule")
    }
    var newObjs = bundle.InsertedBeans
    var lastRun = IRSchedule_ACC.findLastRunSchedule()
    newObjs.each(\n -> {
      if (n typeis IRSchedule_ACC) {
        checkOne(n, lastRun)
      }
    })
    if (newObjs?.Count > MAX_SCHEDULE_ENTRIES) {
      throw new DisplayableException("Cannot create more than ${MAX_SCHEDULE_ENTRIES} schedule entries")
    }

    var updateObjs = bundle.InsertedBeans
    updateObjs.each(\u -> {
      if (u typeis IRSchedule_ACC) {
        checkOne(u, lastRun)
      }
    })
    var removedObjs = bundle.RemovedBeans
    removedObjs.each(\r -> {
      if (r typeis IRSchedule_ACC && r.ExternalKey != null) {
        throw new DisplayableException("Cannot remove a schedule that's been already run.  RunDate ${r.RunDate}}, Batch ${r.ExternalKey}")
      }
    })

  }

  /**
   * Validate just one schedule
   */
  private function checkOne(schedule: IRSchedule_ACC, lastRun: IRSchedule_ACC) {
    if (schedule.RunDate.Calendar.CalendarYear != _runYear) {
      throw new DisplayableException("Please provide schedule for Year ${_runYear}")
    }
    if (lastRun != null && lastRun.RunDate.after(schedule.RunDate)) {
      throw new DisplayableException("The run date cannot be earlier than ${lastRun.RunDate}")
    }
  }
}