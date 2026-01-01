package edge.capabilities.quote.lob.commercialproperty.util

uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.quote.coverage.util.CoverageUtil
uses edge.capabilities.quote.lob.commercialproperty.draft.dto.BuildingDTO
uses edge.capabilities.quote.lob.commercialproperty.quoting.dto.BuildingCoverageDTO
uses edge.util.helper.CurrencyOpUtil
uses gw.api.productmodel.CoveragePattern
uses java.lang.Exception
uses java.lang.UnsupportedOperationException

uses java.math.BigDecimal

class BuildingCoveragesUtil {

  private construct() {
    throw new UnsupportedOperationException()
  }

  public static function toDTO(bldg: CPBuilding, line: CPLine): BuildingCoverageDTO {
    final var res = new BuildingCoverageDTO()
    res.FixedId = bldg.FixedId.Value
    res.PublicID = bldg.PublicID
    res.Building = getBuilding(bldg)
    var bldgCov = getBuildingCoverages(line, bldg)
    res.Coverages = bldgCov.map(\cov -> CoverageUtil.toDTO(cov, bldg, \c -> costOfBuilding(c)))

    res.Premium = new AmountDTO()
    for(cov in res.Coverages){
      res.Premium.Amount = res.Premium.Amount.add(cov.Amount.Amount != null ? cov.Amount.Amount: 0)
    }

    return res
  }

  public static function getBuildingCoverages(line: CPLine, bldg: CPBuilding): CoveragePattern[] {

    final var coverageCategory = line.Pattern.getCoverageCategoryByCodeIdentifier("CPBldgCovCategory")
    final var busIncCoverageCategory = line.Pattern.getCoverageCategoryByCodeIdentifier("CPBusIncCovCategory")
    var buildingCov = coverageCategory.coveragePatternsForEntity(entity.CPBuilding).where(\c -> bldg.isCoverageSelectedOrAvailable(c))
    var incomeCov = busIncCoverageCategory.coveragePatternsForEntity(entity.CPBuilding).where(\c -> bldg.isCoverageSelectedOrAvailable(c))

    return buildingCov.concat(incomeCov)
  }

  private static function costOfBuilding(cov: Coverage): AmountDTO {
    switch (typeof cov) {
      case CPBldgCov:
        final var cpCov = cov as CPBldgCov
        return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(cpCov.Costs))
      case CPBldgBusIncomeCov:
        final var cpCov = cov as CPBldgBusIncomeCov
        return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(cpCov.Costs))
      case CPBldgStockCov:
        final var cpCov = cov as CPBldgStockCov
        return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(cpCov.Costs))
      case CPBPPCov:
        final var cpCov = cov as CPBPPCov
        return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(cpCov.Costs))
      case CPBldgExtraExpenseCov:
        final var cpCov = cov as CPBldgExtraExpenseCov
        return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(cpCov.Costs))

      default:
        throw new Exception("Unsupported coverage type " + typeof cov)
    }
  }

  private static function getBuilding(bldg : CPBuilding) : BuildingDTO {

    var building = new BuildingDTO()
    building.ClassCode = bldg.ClassCode.Code
    building.CoverageForm = bldg.CoverageForm
    building.RateType = bldg.RateType
    building.Description = bldg.DisplayName
    building.YearBuilt = bldg.Building.YearBuilt
    building.ConstructionType = bldg.Building.ConstructionType
    building.BuildingNumber = bldg.Building.BuildingNum
    building.locationId = bldg.getCPLocation().PublicID
    building.AddressDisplayName = bldg.CPLocation.Location.DisplayName

    return building
  }

  public static function updateCustomBuilding(line: CPLine, bldg: CPBuilding, update: BuildingCoverageDTO) {
    CoverageUtil.updateFrom(bldg, BuildingCoveragesUtil.getBuildingCoverages(line, bldg), update.Coverages)
  }

}
