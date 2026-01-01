package nz.co.acc.common.workqueueconfig

uses gw.api.database.Query
uses gw.api.webservice.maintenanceTools.WQueueExecutorDetails
uses nz.co.acc.util.MaintenanceToolsAPIUtil

uses java.time.LocalTime
uses java.util.regex.Pattern

/**
 * Helper class for Work Queue Config feature.
 * <p>
 * Created by Mike Ourednik on 5/03/21.
 */
class WorkQueueConfigUtil {
  static final var TIME_PATTERN = Pattern.compile("(\\d{2}):(\\d{2})")
  static final var MAX_INSTANCES = 100
  static final var MAX_BATCH_SIZE = 500
  static var _maintenanceTools = MaintenanceToolsAPIUtil.getMaintenanceToolsAPI()

  public static function toLocalTime(hhmm : String) : LocalTime {
    if (hhmm == null) {
      throw new RuntimeException("Invalid localtime string [null]")
    }
    var matcher = TIME_PATTERN.matcher(hhmm)
    if (!matcher.matches()) {
      throw new RuntimeException("Invalid localtime string [${hhmm}]")
    }
    var hour = matcher.group(1).toInt()
    var minute = matcher.group(2).toInt()
    return LocalTime.of(hour, minute)
  }

  /**
   * Check if 'now' timestamp is within the idle interval
   *
   * @param now
   * @param idleStart
   * @param idleEnd
   * @return
   */
  public static function isIdleTime(now : LocalTime, idleStart : LocalTime, idleEnd : LocalTime) : Boolean {
    if (idleEnd < idleStart) {
      // idle time crosses midnight
      return (now == idleStart or now > idleStart) or now < idleEnd
    } else {
      return (now == idleStart or now > idleStart) and now < idleEnd
    }
  }

  public static function fetchWorkQueueConfigOverrides() : WorkQueueConfig_ACC[] {
    return Query.make(WorkQueueConfig_ACC).select().toTypedArray()
  }

  public static function getWorkQueueExecutorDetails(batchProcessType : BatchProcessType) : WQueueExecutorDetails[] {
    return _maintenanceTools.getWQueueStatus(batchProcessType.Code)
        .getExecutors().where(\executorDetails -> executorDetails.Active)
  }

  public static function initializeConfig() : WorkQueueConfig_ACC[] {
    new WorkQueueConfigInitializer().initializeConfigs()
    return fetchWorkQueueConfigOverrides()
  }

  /**
   * UI helper to validate configuration
   *
   * @param localTimeString
   * @return
   */
  public static function validateLocalTimeString(localTimeString : String) : String {
    try {
      toLocalTime(localTimeString)
      return null
    } catch (e : Exception) {
      return e.Message
    }
  }

  /**
   * UI helper to validate configuration
   *
   * @param workQueueConfig
   * @return
   */
  public static function validateInstances(workQueueConfig : WorkQueueConfig_ACC) : String {
    if (workQueueConfig.Instances == null) {
      return "Not defined"
    } else if (workQueueConfig.Instances < 0) {
      return "Cannot be negative"
    } else if (workQueueConfig.Instances > MAX_INSTANCES) {
      return "Exceeds max value ${MAX_INSTANCES}"
    } else return null
  }

  public static function validateBatchSize(workQueueConfig : WorkQueueConfig_ACC) : String {
    if (workQueueConfig.BatchSize == null) {
      return "Not defined"
    } else if (workQueueConfig.BatchSize < 1) {
      return "Must be greater than zero"
    } else if (workQueueConfig.BatchSize > MAX_BATCH_SIZE) {
      return "Exceeds max value ${MAX_BATCH_SIZE}"
    } else return null
  }

  public static function validateIdleInstances(workQueueConfig : WorkQueueConfig_ACC) : String {
    if (workQueueConfig.IdleEnabled) {
      if (workQueueConfig.IdleInstances == null) {
        return "Not defined"
      }
      if (workQueueConfig.IdleInstances < 0) {
        return "Cannot be negative"
      }
      if (workQueueConfig.IdleInstances > MAX_INSTANCES) {
        return "Exceeds max value ${MAX_INSTANCES}"
      }
    }
    return null
  }

  public static function validateIdleStartTime(workQueueConfig : WorkQueueConfig_ACC) : String {
    if (workQueueConfig.IdleEnabled) {
      if (workQueueConfig.IdleStartTime == null) {
        return "Not defined"
      } else
        return WorkQueueConfigUtil.validateLocalTimeString(workQueueConfig.IdleStartTime)
    }
    return null
  }

  public static function validateIdleEndTime(workQueueConfig : WorkQueueConfig_ACC) : String {
    if (workQueueConfig.IdleEnabled) {
      if (workQueueConfig.IdleEndTime == null) {
        return "Not defined"
      } else
        return WorkQueueConfigUtil.validateLocalTimeString(workQueueConfig.IdleEndTime)
    }
    return null
  }

}