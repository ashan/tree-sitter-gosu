package edge.capabilities.quote.lob.commercialproperty.draft

uses edge.capabilities.quote.lob.commercialproperty.draft.dto.LocationDTO
uses edge.capabilities.address.dto.AddressDTO
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.BuildingDTO
uses edge.di.annotations.InjectableNode
uses edge.di.annotations.ForAllGwNodes
uses gw.api.domain.LineSpecificLocation
uses gw.transaction.Transaction
uses edge.PlatformSupport.Bundle

class DefaultCPLocationPlugin implements  ILocationPlugin {



 private var _buildingPlugin : IBuildingPlugin

  @ForAllGwNodes
  construct(aBuildingPlugin : IBuildingPlugin) {
     this._buildingPlugin = aBuildingPlugin
  }

  override function toDTO(cpLocation: CPLocation): LocationDTO {
    var loc = new LocationDTO()

    loc.PublicID = cpLocation.PublicID
    loc.Address = new AddressDTO()
    loc.Address.AddressLine1 = cpLocation.Location.AddressLine1
    loc.Address.City = cpLocation.Location.City
    loc.Address.PostalCode = cpLocation.Location.PostalCode
    loc.Address.State = cpLocation.Location.State
    loc.Address.Country = cpLocation.Location.Country
    loc.TerritoryCode = cpLocation.TerritoryCode.Code

    loc.DisplayName = cpLocation.Location.DisplayName.split(":", 2).last()
    loc.FireProtection = cpLocation.Location.FireProtectClass
    loc.Phone = cpLocation.Location.AccountLocation.Phone
    loc.LocationCode = cpLocation.Location.AccountLocation.LocationCode
    loc.IsPrimary = cpLocation.Location.PrimaryLoc


    loc.Buildings = cpLocation.Buildings.map<BuildingDTO>(\building -> _buildingPlugin.toDTO(building))

    return loc
  }

  override function updateLocation(location: CPLocation, dto: LocationDTO): CPLocation {
    location.Location.AddressLine1 = dto.Address.AddressLine1
    location.Location.AddressLine2 = dto.Address.AddressLine2
    location.Location.AddressLine3 = dto.Address.AddressLine3
    location.Location.PostalCode = dto.Address.PostalCode
    location.Location.City = dto.Address.City
    location.Location.State = dto.Address.State
    location.Location.Country = dto.Address.Country
    if(dto.TerritoryCode == null) {
        location.TerritoryCode.fillWithFirst()
    }
    else {
         location.TerritoryCode.Code = dto.TerritoryCode
    }

    return location
  }

  override function territoryCodeLookup(jobNumber: String, address : AddressDTO, bundle: Bundle) : String {

    var locationCode : String

    var sub = Submission.finder.findJobByJobNumber(jobNumber).LatestPeriod
    var cpLine = sub.CPLine
    cpLine = bundle.add(cpLine)
    var cpLocation = cpLine.addNewLineSpecificLocation() as CPLocation

    cpLocation.Location.AddressLine1 = address.AddressLine1
    cpLocation.Location.AddressLine2 = address.AddressLine2
    cpLocation.Location.AddressLine3 = address.AddressLine3
    cpLocation.Location.PostalCode = address.PostalCode
    cpLocation.Location.City = address.City
    cpLocation.Location.State = address.State
    cpLocation.Location.Country = address.Country
    cpLocation.TerritoryCode.fillWithFirst()

    locationCode = cpLocation.TerritoryCode.Code
    bundle.delete(cpLocation)

    return locationCode
  }
}
