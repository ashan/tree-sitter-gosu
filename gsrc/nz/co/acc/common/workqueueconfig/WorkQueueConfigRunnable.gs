package nz.co.acc.common.workqueueconfig

uses gw.api.database.Query
uses gw.api.webservice.maintenanceTools.WorkQueueConfig
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.util.MaintenanceToolsAPIUtil

/**
 * Polls for configuration changes and updates work queue instances
 */
class WorkQueueConfigRunnable implements Runnable {
  private static var _log = StructuredLogger.CONFIG.withClass(WorkQueueConfigRunnable)
  static var _maintenanceTools = MaintenanceToolsAPIUtil.getMaintenanceToolsAPI()

  override function run() {
    _log.debug("Polling work queue config")
    try {
      for (dbConfig in fetchConfigs()) {
        var activeConfig = _maintenanceTools.getWorkQueueConfig(dbConfig.WorkQueue.Code)
        if (isConfigChanged(activeConfig, dbConfig)) {
          updateActiveConfig(dbConfig)
        }
      }
    } catch (e : Exception) {
      _log.error_ACC("Error occurred when polling/updating work queue configuration", e)
    }
  }

  function isConfigChanged(activeConfig: WorkQueueConfig, dbConfig: WorkQueueConfig_ACC): Boolean {
    if (activeConfig.Instances != dbConfig.CurrentInstances) {
      return true
    } else if (activeConfig.BatchSize != dbConfig.BatchSize) {
      return true
    } else {
      return false
    }
  }

  function updateActiveConfig(config : WorkQueueConfig_ACC) {
    _log.info("Config changed for ${config.WorkQueue}. Instances=${config.CurrentInstances}, BatchSize=${config.BatchSize}")
    var instances = config.CurrentInstances
    var newConfig = new WorkQueueConfig()
    newConfig.Instances = instances
    newConfig.BatchSize = config.BatchSize
    newConfig.ThrottleInterval = config.ThrottleInterval
    newConfig.MaxPollInterval = config.MaxPollInterval
    _maintenanceTools.setWorkQueueConfig(config.WorkQueue.Code, newConfig)
  }

  function fetchConfigs() : List<WorkQueueConfig_ACC> {
    return Query.make(WorkQueueConfig_ACC).select().toList()
  }
}