package nz.co.acc.common.integration.configurationservice

uses gw.api.startable.IStartablePlugin
uses gw.api.startable.StartablePluginCallbackHandler
uses gw.api.startable.StartablePluginState
uses gw.plugin.InitializablePlugin

/**
 * Loads the configuration properties from an external properties file. See {@link ConfigurationPropertyLoader} for
 * details. The properties can be reloaded by restarting the plugin via System Tools view.
 * <p>
 * Created by Kaushalya Samarasekera
 */
@Distributed
class ConfigurationPropertiesStartablePlugin implements IStartablePlugin, InitializablePlugin {

  var _state: StartablePluginState

  override function start(startablePluginCallbackHandler: StartablePluginCallbackHandler, b: boolean) {
    if (!ConfigurationPropertyLoader.Singleton.IsInitialised) {
      ConfigurationPropertyLoader.Singleton.init()
    }
    SecurePropertyLoader.Instance.load()
    this._state = StartablePluginState.Started
  }

  override function stop(b: boolean) {
    ConfigurationPropertyLoader.Singleton.reset()
    this._state = StartablePluginState.Stopped
  }

  override property get State(): StartablePluginState {
    return this._state
  }

  override property set Parameters(map : Map) {

  }
}
