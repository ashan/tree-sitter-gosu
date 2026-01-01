package nz.co.acc.common.workqueueconfig

uses gw.api.system.server.ServerUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.util.concurrent.Executors
uses java.util.concurrent.ScheduledFuture
uses java.util.concurrent.TimeUnit

/**
 * Runs a scheduled future to refresh/update work queue configurations
 * <p>
 * Created by Mike Ourednik on 1/03/2021.
 */
class WorkQueueConfigScheduler {
  private static var _log = StructuredLogger.CONFIG.withClass(WorkQueueConfigScheduler)
  final static var _scheduler = Executors.newSingleThreadScheduledExecutor()
  final var _interval = 15
  var _scheduledFuture : ScheduledFuture

  public construct() {
  }

  public function start() {
    if (ServerUtil.getAllRoles().contains("workqueue")) {
      _log.info("Starting scheduler with interval ${_interval}")
      _scheduledFuture = _scheduler.scheduleAtFixedRate(new WorkQueueConfigRunnable(), 0, _interval, TimeUnit.SECONDS);
    } else {
      _log.info("Not starting scheduler. Server does not have workqueue role.")
    }
  }

  public function stop() {
    _log.info("Stopping scheduler")
    _scheduledFuture?.cancel(false)
  }

}