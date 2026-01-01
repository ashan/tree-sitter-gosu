package gw.api.upgrade.enhancements

uses java.lang.annotation.Retention
uses java.lang.annotation.Target

/**
 * File created by Guidewire Upgrade Tools.
 */
@Target(METHOD)
@Retention(RUNTIME)
annotation DeprecatedAndRestoredByUpgrade {

  function purpose() : String = "Removed from the API, restored by the Upgrade Tools for backward compatibility"
}