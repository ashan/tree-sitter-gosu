package nz.co.acc.plm.integration.ir.schedule

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.plm.integration.ir.inbound.IRFeedDTO
uses nz.co.acc.plm.integration.ir.util.BundleHelper

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Enhancements for the {@code IRSchedule_ACC} entity.
 */
enhancement IRScheduleEnhancement : IRSchedule_ACC {

  /**
   * Validates a given feed against the next schedule entry.
   *
   * @param feedDto feed details
   * @return schedule, if matched. {@code null} if no schedule available or feed is off-schedule.
   */
  public static function validate(feedDto : IRFeedDTO) : IRSchedule_ACC {
    var fn = "validate"
    var schedule = IRSchedule_ACC.findNextSchedule()

    if (schedule == null) {
      StructuredLogger.INTEGRATION.warn_ACC(schedule + " " + fn + " " + "Either no schedule exists or all the schedule entries have been marked as completed.")

    } else {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        schedule = BundleHelper.explicitlyAddBeanToBundle(bundle, schedule, false)
        var matched = schedule.match(feedDto)
        if (!matched) {
          StructuredLogger.INTEGRATION.warn_ACC( schedule + " " + fn + " " + "The feed is off-schedule: ${feedDto}")
        }
      })
    }

    return schedule
  }

  /**
   * Matches a given IR feed with the schedule entry.
   *
   * @param feedDto IR feed details
   * @return {@code true} if matched.
   */
  public function match(feedDto : IRFeedDTO) : boolean {
    return match(feedDto.RunDate, feedDto.FeedType, feedDto.LevyYear)
  }

  /**
   * Matches a given IR feed with the schedule entry.
   *
   * @param runDate  rundate of the IR feed
   * @param feedType type of the IR feed
   * @param levyYear levy year of the IR feed
   * @return {@code true} if matched.
   */
  public function match(runDate : Date, feedType : IRInboundFeedType_ACC, levyYear : Integer) : boolean {
    if (this.IsBlocked) {
      return false
    }

    var days = ScriptParameters.IR_Max_Schedule_Days_Offset_ACC
    var runDateLowerCap = this.RunDate.addDays(-days)
    var runDateUpperCap = this.RunDate.addDays(days)

    if (runDate.before(runDateLowerCap) || runDate.after(runDateUpperCap)) {
      this.IsBlocked = true
      this.RuntimeMessage = "The inbound file run date is not within the expected time window. "
          + "Received: ${runDate.toISODate()}, Expected window: ${runDateLowerCap.toISODate()} and ${runDateUpperCap.toISODate()} (inclusive)"
      return false
    }

    if (feedType != this.IRInboundFeedType_ACC) {
      this.IsBlocked = true
      this.RuntimeMessage = "The inbound file feed type did not match scheduled feed type. Received: ${feedType}, Expected: ${this.IRInboundFeedType_ACC}"
      return false
    }

    if (feedType != IRInboundFeedType_ACC.TC_REGISTRATIONS) {
      if (levyYear != null && this.LevyYear != null && levyYear != this.LevyYear) {
        this.IsBlocked = true
        this.RuntimeMessage = "The inbound file levy year did not match scheduled levy year. Received: ${levyYear}, Expected: ${this.LevyYear}"
        return false
      }
    }

    this.RuntimeMessage = null
    return true
  }

  /**
   * Find next available schedule.
   */
  public static function findNextSchedule() : IRSchedule_ACC {
    return Query.make(IRSchedule_ACC)
        .compare(IRSchedule_ACC#ExternalKey, Relop.Equals, null)
        .select()
        .orderBy(QuerySelectColumns.path(Paths.make(IRSchedule_ACC#RunDate)))
        .first()
  }

  /**
   * Find last run schedule.
   */
  public static function findLastRunSchedule() : IRSchedule_ACC {
    return Query.make(IRSchedule_ACC)
        .compare(IRSchedule_ACC#ExternalKey, Relop.NotEquals, null)
        .select()
        .orderBy(QuerySelectColumns.path(Paths.make(IRSchedule_ACC#RunDate)))
        .first()
  }

}
