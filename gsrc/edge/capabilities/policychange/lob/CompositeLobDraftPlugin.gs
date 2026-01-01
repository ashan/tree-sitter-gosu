package edge.capabilities.policychange.lob

uses java.util.Map
uses edge.di.annotations.ForAllGwNodes
uses edge.di.CapabilityAndPath
uses edge.di.boot.Bootstrap
uses edge.capabilities.policychange.dto.DraftLobDataDTO
uses edge.di.Path
uses edge.capabilities.policychange.dto.PolicyChangeHistoryDTO
uses gw.api.diff.DiffItem

/**
 * Simple lob-delegating plugin.
 */
class CompositeLobDraftPlugin implements ILobDraftPlugin <DraftLobDataDTO> {

  private var _lobMap : Map<String, ILobDraftPlugin >

  /**
   * Creates a new composite draft plugin
   */
  @ForAllGwNodes
  construct() {
    //Using Bootstrap as a service locator until DI framework evolves to support injecting a map of dependencies
    _lobMap = Bootstrap.forceCreateMap< ILobDraftPlugin >(new CapabilityAndPath("policychange", Path.parse("policychange.draft.lob")))
  }

  override function compatibleWithProduct(code : String) : boolean {    
    return _lobMap.values().hasMatch( \ lob -> lob.compatibleWithProduct(code))
  }

  override function updateExistingDraftSubmission(period : PolicyPeriod, update : DraftLobDataDTO) {
    for (entry in _lobMap.entrySet()) {
      entry.Value.updateExistingDraftSubmission(period, update[entry.Key])
    }
  }

  override function toDraftDTO(period: PolicyPeriod): DraftLobDataDTO {
    final var res = new DraftLobDataDTO()
    for (entry in _lobMap.entrySet()) {
      res[entry.Key] = entry.Value.toDraftDTO(period)
    }
    return res
  }

  override function toHistoryDTO(diff: DiffItem): PolicyChangeHistoryDTO {
    if ( diff.Bean typeis PolicyAddress ) {
      return new PolicyChangeHistoryDTO() {
        : Action = "changed",
        : EntityType = "address",
        : FixedId = diff.Bean.FixedId.Value
      }
    } else {
      var dto : PolicyChangeHistoryDTO
      for(lobPlugin in _lobMap.Values) {
        dto = lobPlugin.toHistoryDTO(diff)
        if ( dto != null ) {
          break;
        }
      }
      return dto
    }
  }
}
