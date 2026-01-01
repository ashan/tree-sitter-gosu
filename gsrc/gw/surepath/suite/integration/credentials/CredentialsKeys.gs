package gw.surepath.suite.integration.credentials

uses gw.api.locale.DisplayKey

public enum CredentialsKeys {
  SUITE_AB_INTEGRATION(\ -> "suite.ab.integration"),
  SUITE_BC_INTEGRATION(\ -> "suite.bc.integration")

  private var _displayResolver : block() : String as DisplayResolver
  override function toString() : String {
    return DisplayResolver()
  }

  private construct(resolveDisplayKey() : String) {
    _displayResolver = resolveDisplayKey
  }
}