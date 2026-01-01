package edge.capabilities.quote.lob
uses edge.di.annotations.ForAllGwNodes
uses java.util.Map
uses edge.di.boot.Bootstrap
uses edge.di.CapabilityAndPath
uses edge.di.Path
uses edge.capabilities.quote.lob.dto.DraftLobDataDTO

/**
 * Simple lob-delegating plugin.
 */
class CompositeLobDraftPlugin implements ILobDraftPlugin <DraftLobDataDTO> {

  private var _lobMap : Map<String, ILobDraftPlugin >
  
  /**
   * Creates a new composite draft plugin
   */
  @ForAllGwNodes("quote")
  @ForAllGwNodes("policychange")
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobDraftPlugin >(new CapabilityAndPath("quote", Path.parse("quote.draft.lob")))
  }

  construct(capability: String) {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobDraftPlugin >(new CapabilityAndPath(capability, Path.parse("quote.draft.lob")))
  }

  override function compatibleWithProduct(code : String) : boolean {    
    return _lobMap.values().hasMatch( \ lob -> lob.compatibleWithProduct(code))
  }


  override function updateNewDraftSubmission(period : PolicyPeriod, update : DraftLobDataDTO) {
    for (entry in _lobMap.entrySet()) {
      entry.Value.updateNewDraftSubmission(period, update[entry.Key])
    }
  }

  override function updateExistingDraftSubmission(period : PolicyPeriod, update : DraftLobDataDTO) {
    for (entry in _lobMap.entrySet()) {
      entry.Value.updateExistingDraftSubmission(period, update[entry.Key])
    }
  }

  override function toDraftDTO(period : PolicyPeriod) : DraftLobDataDTO {
    final var res = new DraftLobDataDTO()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.toDraftDTO(period)
    }
    return res
  }
}
