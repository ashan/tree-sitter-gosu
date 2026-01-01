package nz.co.acc.integration.util

uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.webservice.pc.pc1000.MaintenanceToolsAPI

class WorkQueueUtil {
  final var LOGGER = StructuredLogger.INTEGRATION
  final var _maintenanceToolsAPI = new MaintenanceToolsAPI()
  private var _batchProcessType : BatchProcessType

  construct(batchProcessType : BatchProcessType) {
    _batchProcessType = batchProcessType
  }

  public function getNumActiveWorkItems() : int {
    return _maintenanceToolsAPI.getNumActiveWorkItems(_batchProcessType.Code)
  }

  public function startWorkQueue() {
    LOGGER.info("Starting work queue: ${_batchProcessType}")
    _maintenanceToolsAPI.startBatchProcess(_batchProcessType.Code)
  }

  public function startWorkQueueIfNoActiveWorkItems() : boolean {
    var activeWorkItems = getNumActiveWorkItems()
    if (activeWorkItems > 0) {
      LOGGER.info("Work queue already has active work items: ${_batchProcessType}")
      return false
    } else {
      startWorkQueue()
      return true
    }
  }

}