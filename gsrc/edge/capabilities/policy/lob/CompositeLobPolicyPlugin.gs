package edge.capabilities.policy.lob

uses edge.capabilities.policy.lob.dto.PolicyLobDataDTO
uses edge.di.annotations.ForAllGwNodes
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path

/**
 * Creates a new composite policy plugin that retrieves policy line information.
 * Delegates the same function call to each of the LOB specific plugins
 */
class CompositeLobPolicyPlugin implements ILobPolicyPlugin <PolicyLobDataDTO>{

  private var _lobMap : Map<String, ILobPolicyPlugin>


  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobPolicyPlugin >(new CapabilityAndPath("policy", Path.parse("policy.lob")))
  }

  override function getPolicyLineInfo(period : PolicyPeriod) : PolicyLobDataDTO{

    final var res = new PolicyLobDataDTO()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.getPolicyLineInfo(period)
    }
    return res
  }


}

