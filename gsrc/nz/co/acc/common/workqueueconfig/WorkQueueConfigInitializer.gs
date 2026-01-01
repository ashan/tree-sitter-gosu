package nz.co.acc.common.workqueueconfig

uses gw.api.webservice.maintenanceTools.WorkQueueConfig
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.util.MaintenanceToolsAPIUtil

/**
 * Initialializes new work queue config entries. Deletes configs for retired work queues.
 */
class WorkQueueConfigInitializer {
  private static var _log = StructuredLogger.CONFIG.withClass(WorkQueueConfigInitializer)
  static var _maintenanceTools = MaintenanceToolsAPIUtil.getMaintenanceToolsAPI()

  function initializeConfigs() {
    var currentQueueNames = _maintenanceTools.getWorkQueueNames().toSet()
    var workQueueConfigs = WorkQueueConfigUtil.fetchWorkQueueConfigOverrides()
    var workQueueConfigNames = workQueueConfigs.map(\workQueueConfig -> workQueueConfig.WorkQueue.Code).toSet()

    var queuesToRetire = workQueueConfigNames.copy()
    queuesToRetire.removeWhere(\queueName -> currentQueueNames.contains(queueName))
    deleteRetiredConfigs(queuesToRetire)

    var newQueueNames = currentQueueNames.where(\queueName -> not workQueueConfigNames.contains(queueName))

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      for (queueName in newQueueNames) {
        _log.info("Initializing WorkQueueConfig_ACC: ${queueName} ")
        var workQueueConfig = _maintenanceTools.getWorkQueueConfig(queueName)
        toEntity(queueName, workQueueConfig, bundle)
      }
    })
  }

  function toEntity(workQueueName : String, workQueueConfig : WorkQueueConfig, bundle : Bundle) {
    var config = new WorkQueueConfig_ACC(bundle)
    config.WorkQueue = BatchProcessType.get(workQueueName)
    config.Instances = workQueueConfig.Instances
    config.IdleEnabled = false
    config.BatchSize = workQueueConfig.BatchSize
    config.ThrottleInterval = workQueueConfig.ThrottleInterval as int
    config.MaxPollInterval = workQueueConfig.MaxPollInterval as int
  }

  function deleteRetiredConfigs(retiredQueueNames : Set<String>) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      for (config in WorkQueueConfigUtil.fetchWorkQueueConfigOverrides()) {
        if (retiredQueueNames.contains(config.WorkQueue.Code)) {
          _log.info("Deleting retired WorkQueueConfig_ACC: ${config.WorkQueue}")
          bundle.add(config).remove()
        }
      }
    })
  }

  function run() {
    _log.info("Checking work queue config")
    try {
      for (config in WorkQueueConfigUtil.fetchWorkQueueConfigOverrides()) {
        var activeConfig = _maintenanceTools.getWorkQueueConfig(config.WorkQueue.Code)
        if (activeConfig.Instances != config.CurrentInstances) {
          updateInstances(config)
        }
      }
    } catch (e : Exception) {
      _log.error_ACC("Error occurred when polling/updating work queue configuration", e)
    }
  }

  function updateInstances(config : WorkQueueConfig_ACC) {
    var instances = config.CurrentInstances
    _log.info("Config changed for work queue [${config.WorkQueue}]. Updating instances to: ${instances}.")
    var newConfig = new WorkQueueConfig()
    newConfig.Instances = instances
    newConfig.BatchSize = config.BatchSize
    newConfig.ThrottleInterval = config.ThrottleInterval
    newConfig.MaxPollInterval = config.MaxPollInterval
    _maintenanceTools.setWorkQueueConfig(config.WorkQueue.Code, newConfig)
  }

}