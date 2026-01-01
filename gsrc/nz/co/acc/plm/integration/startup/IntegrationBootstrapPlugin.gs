package nz.co.acc.plm.integration.startup

uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState
uses gw.lang.function.IBlock

/**
 * Startable plugin to invoke a registry of IBlocks at the time of server startup.
 * You can register a block that invokes a specific operation that's required to be executed during startup.
 * <p>
 * Created by Kaushalya Samarasekera
 */
@Distributed
class IntegrationBootstrapPlugin implements IStartablePlugin {

  /**
   * List of hooks registered with this plugin.
   */
  final var _hooks: List<IBlock>

  /**
   * State of the plugin
   */
  var _state: StartablePluginState

  construct() {
    _hooks = new ArrayList<IBlock>();

    //---------------------------
    // Register your hook below.
    //---------------------------

    _hooks.add(\-> {
      // do something
    })
  }

  override function start(startablePluginCallbackHandler: StartablePluginCallbackHandler, b: boolean) {
    _hooks.each(\elt -> elt.invokeWithArgs({}))
    _state = Started
  }

  override function stop(b: boolean) {
    _state = Stopped
  }

  override property get State(): StartablePluginState {
    return _state
  }

}
