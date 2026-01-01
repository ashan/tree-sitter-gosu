package edge.capabilities.quote.lob.commercialproperty.draft

uses edge.capabilities.quote.lob.commercialproperty.draft.dto.BuildingDTO


/**
 * Interface used by LOBs to extend metadata generation for quote handler. At this moment only question set extensions
 * are supported.
 */
interface IBuildingPlugin {
  public function toDTO(building : CPBuilding) : BuildingDTO
  public function updateBuilding(building : CPBuilding, dto : BuildingDTO) : CPBuilding
  public function isBuildingCodeValid(code : String) : boolean
}
