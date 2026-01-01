package edge.capabilities.policy.lob

uses edge.di.annotations.ForAllGwNodes
uses java.util.Map
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses java.lang.StringBuilder

/**
 * Default implementation of the policy summary plugin.
 */
class CompositeLobPolicySummaryPlugin implements ILobPolicySummaryPlugin {

  private var _lobMap : Map<String, ILobPolicySummaryPlugin>


  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap<ILobPolicySummaryPlugin>(new CapabilityAndPath("policy", Path.parse("policysummary.lob")))
  }
  
  
  override function getPolicyLineOverview(period : PolicyPeriod) : String {

    return _lobMap.entrySet()
      .map(\ entry -> entry.Value.getPolicyLineOverview(period))
      .where(\description ->description != null)
      .join("\n")
  }
}
