package edge.capabilities.quote.lob.commercialproperty.draft

uses edge.capabilities.quote.lob.ILobDraftPlugin
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.CpDraftDataExtensionDTO
uses edge.capabilities.quote.lob.commercialproperty.quoting.dto.BuildingCoverageDTO
uses edge.capabilities.quote.lob.commercialproperty.util.BuildingCoveragesUtil
uses edge.di.annotations.InjectableNode
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.LocationDTO
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.BuildingDTO
uses gw.api.database.Query
uses java.lang.IllegalArgumentException
uses gw.api.productmodel.QuestionSet
uses java.util.ArrayList

class CpDraftPlugin implements ILobDraftPlugin<CpDraftDataExtensionDTO> {

  private var _locationPlugin : ILocationPlugin
  private var _buildingPlugin : IBuildingPlugin
  @InjectableNode

  construct(locationPlugin : ILocationPlugin, buildingPlugin : IBuildingPlugin) {
    this._locationPlugin = locationPlugin
    this._buildingPlugin = buildingPlugin
  }
  override function compatibleWithProduct(code: String): boolean {
    return code == "CommercialProperty"
  }

  override function updateNewDraftSubmission(period: PolicyPeriod, update: CpDraftDataExtensionDTO) {
    if (!period.CPLineExists) {
      return
    }
  }


  override function updateExistingDraftSubmission(period: PolicyPeriod, update: CpDraftDataExtensionDTO) {
    if (!period.CPLineExists) {
      return
    }
    final var cpLine = period.CPLine

    //check deleted locations
    foreach(loc in cpLine.CPLocations) {

      var locationStillExist = update.Locations.hasMatch(\ldto -> ldto.PublicID?.equals(loc.PublicID))
      if (!locationStillExist) {
        cpLine.removeFromCPLocations(loc)
      }
    }

    //add and update locations
    for(location in update.Locations) {
      var cpLocation = cpLine.CPLocations.firstWhere(\loc -> loc.PublicID == location.PublicID)

      if (cpLocation == null) {
        //Create New Location
        cpLocation = cpLine.addNewLineSpecificLocation() as CPLocation
        cpLine.addToCPLocations(_locationPlugin.updateLocation(cpLocation, location))
      } else {
        _locationPlugin.updateLocation(cpLocation, location)
      }

      var building: CPBuilding = null

      //check deleted buildings
      foreach(b in cpLocation.Buildings) {

        var buildindStillExist = location.Buildings.hasMatch(\bdto -> bdto.PublicID?.equals(b.PublicID))
        if (!buildindStillExist) {
          cpLocation.removeFromBuildings(b)
        }
       }

      //add and update building
      foreach (buildingDTO in location.Buildings) {
        if (cpLocation.Buildings.Count > 0){
          building = cpLocation.Buildings.firstWhere(\elt -> elt.LocationBuilding.BuildingNum == buildingDTO.BuildingNumber)
          if (building == null) {
            building = cpLocation.addNewLineSpecificBuilding() as CPBuilding
            cpLocation.addToBuildings(_buildingPlugin.updateBuilding(building, buildingDTO))
          }
          else {
            _buildingPlugin.updateBuilding(building, buildingDTO)
          }
        }
        else {
          building = cpLocation.addNewLineSpecificBuilding() as CPBuilding
          cpLocation.addToBuildings(_buildingPlugin.updateBuilding(building, buildingDTO))
        }
      }
    }

    period.Policy.Account.AccountOrgType = update.AccountOrgType

    //Building coverages
    final var bldgSpecs = update.BuildingCoverages.partitionUniquely(\i -> i.PublicID)
    if(bldgSpecs.size() == 0){

      var al = new ArrayList<BuildingCoverageDTO>()
      cpLine.CPLocations.each(\loc -> loc.Buildings.map(\bldg -> al.add(BuildingCoveragesUtil.toDTO(bldg, cpLine))))
      update.BuildingCoverages = al.toTypedArray()
    } else {
      cpLine.CPLocations.each(\loc -> loc.Buildings.each(\bldg -> {
        var bldgupdate = bldgSpecs.get(bldg.PublicID)
        if (bldgupdate == null) {
          //new building added
          bldgupdate = BuildingCoveragesUtil.toDTO(bldg, cpLine)
          var al = new ArrayList<BuildingCoverageDTO>()
          al.add(bldgupdate)
          update.BuildingCoverages.concat(al.toTypedArray())
        }
        BuildingCoveragesUtil.updateCustomBuilding(cpLine, bldg, bldgupdate)
      }))
    }
  }

  override function toDraftDTO(period: PolicyPeriod): CpDraftDataExtensionDTO {
    final var cpLine = period.CPLine
    if (cpLine == null) {
      return null
    }
    final var res = new CpDraftDataExtensionDTO()
    res.Locations = getLocations(cpLine.CPLocations)
    res.AccountOrgType = period.Policy.Account.AccountOrgType
    var al = new ArrayList<BuildingCoverageDTO>()
    cpLine.CPLocations.each(\loc -> loc.Buildings.map(\bldg -> al.add(BuildingCoveragesUtil.toDTO(bldg, cpLine))))
    res.BuildingCoverages = al.toTypedArray()

    return res
  }

  private function getLocations(policyLocations : CPLocation[]) : LocationDTO[] {

    var locations = policyLocations.map<LocationDTO>( \ location -> _locationPlugin.toDTO(location))
    return locations
  }

  /** Question sets used for the DTO. */
  protected function getLineQuestionSets(period : PolicyPeriod) : QuestionSet[] {
    return {}
  }

  /** Policy-level question sets. */
  protected function getPolicyQuestionSets(period : PolicyPeriod) : QuestionSet[] {
    return {}
  }

}
