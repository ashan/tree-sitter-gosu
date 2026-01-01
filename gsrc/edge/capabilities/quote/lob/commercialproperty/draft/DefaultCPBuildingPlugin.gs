package edge.capabilities.quote.lob.commercialproperty.draft

uses edge.capabilities.quote.lob.commercialproperty.draft.dto.BuildingDTO
uses edge.di.annotations.ForAllGwNodes
uses gw.api.database.Query
uses java.lang.IllegalArgumentException

class DefaultCPBuildingPlugin implements  IBuildingPlugin {

  @ForAllGwNodes
  construct() {
  }

  override function toDTO(bldg: CPBuilding): BuildingDTO {
    var building = new BuildingDTO()
    building.PublicID = bldg.PublicID
    building.ClassCode = bldg.ClassCode.Code
    building.CoverageForm = bldg.CoverageForm
    building.RateType = bldg.RateType
    building.Description = bldg.Building.Description
    building.YearBuilt = bldg.Building.YearBuilt
    building.ConstructionType = bldg.Building.ConstructionType
    building.BuildingNumber = bldg.Building.BuildingNum
    building.Name = bldg.DisplayName.split(":", 2).last()
    building.NumberOfStories = bldg.Building.NumStories
    building.TotalAreaExcludingBasement = bldg.Building.TotalArea
    building.Exposure = bldg.Building.FrontSide.Description
    building.AlarmType = bldg.Building.BuildingAlarmType
    building.PercentageSprinklered = bldg.Building.SprinklerCoverage
    return building
  }

  override function updateBuilding(cpBuilding: CPBuilding, dto: BuildingDTO): CPBuilding {

    cpBuilding.ClassCode = lookupBuildingClassCode(dto.ClassCode)
    cpBuilding.CoverageForm = dto.CoverageForm
    cpBuilding.RateType = dto.RateType
    cpBuilding.Building.Description = dto.Description
    cpBuilding.Building.YearBuilt = dto.YearBuilt
    cpBuilding.Building.ConstructionType = dto.ConstructionType
    cpBuilding.Building.NumStories = dto.NumberOfStories
    cpBuilding.Building.TotalArea = dto.TotalAreaExcludingBasement
    cpBuilding.Building.FrontSide.Description = dto.Exposure
    cpBuilding.Building.BuildingAlarmType = dto.AlarmType
    cpBuilding.Building.SprinklerCoverage = dto.PercentageSprinklered

    return  cpBuilding
  }

  function lookupBuildingClassCode(code: String): CPClassCode {
    var classCode = new Query(CPClassCode).compare("Code", Equals, code).select().getAtMostOneRow()

    if (classCode == null) {
      throw new IllegalArgumentException("Cannot find Commercial Property Class Code " + code)
    }
    else {
      return classCode as CPClassCode;
    }
  }

  override function isBuildingCodeValid(code: String): boolean {
    try{
     lookupBuildingClassCode(code)
     return true
    }
    catch(e : IllegalArgumentException){
      return false
    }
  }
}
