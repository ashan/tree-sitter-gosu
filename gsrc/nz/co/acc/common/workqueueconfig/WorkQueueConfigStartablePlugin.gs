package nz.co.acc.common.workqueueconfig

uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState
uses gw.api.system.server.ServerUtil
uses gw.plugin.InitializablePlugin
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Creates a scheduled background task that updates work queue configurations
 * set in the Work Queue Config administration page.
 * <p>
 * Created by Mike Ourednik on 6/03/21.
 */
@Distributed
class WorkQueueConfigStartablePlugin implements IStartablePlugin, InitializablePlugin {
  private static var _log = StructuredLogger.CONFIG.withClass(WorkQueueConfigStartablePlugin)
  var _scheduler = new WorkQueueConfigScheduler()
  var _schedulerStarted = false
  var _state : StartablePluginState

  override function start(startablePluginCallbackHandler : StartablePluginCallbackHandler, b : boolean) {
    if (isPluginEnabled()) {
      _log.info("Starting plugin")
      _scheduler.start()
      _schedulerStarted = true
    }
    this._state = StartablePluginState.Started
  }

  override function stop(b : boolean) {
    _log.info("Stopping plugin")
    if (_schedulerStarted) {
      _scheduler.stop()
      _schedulerStarted = false
    }
    this._state = StartablePluginState.Stopped
  }

  override property get State() : StartablePluginState {
    return this._state
  }

  private function isPluginEnabled() : Boolean {
    if (not ScriptParameters.WorkQueueConfigEnabled_ACC) {
      _log.warn_ACC("Plugin is disabled by script parameter WorkQueueConfigEnabled_ACC")
      return false

    } else if (not ServerUtil.getServerRoles().contains("workqueue")) {
      _log.info("Plugin is disabled because server does not have workqueue role")
      return false

    } else {
      return true
    }
  }

  override property set Parameters(map : Map) {
  }
}
