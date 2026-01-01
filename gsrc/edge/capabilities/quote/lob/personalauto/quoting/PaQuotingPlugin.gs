package edge.capabilities.quote.lob.personalauto.quoting

uses edge.PlatformSupport.TranslateUtil
uses edge.capabilities.quote.lob.ILobQuotingPlugin
uses edge.capabilities.quote.lob.personalauto.quoting.dto.PaAvailableCoveragesDTO
uses edge.capabilities.quote.lob.personalauto.quoting.dto.VehicleCoverageDTO
uses gw.api.productmodel.CoveragePattern
uses edge.capabilities.quote.coverage.util.CoverageUtil
uses edge.util.helper.CurrencyOpUtil
uses java.lang.IllegalArgumentException
uses edge.di.annotations.InjectableNode
uses edge.capabilities.currency.dto.AmountDTO
uses edge.capabilities.quote.quoting.util.OfferingUtil
uses gw.api.productmodel.Offering
uses gw.api.util.Logger
uses java.lang.Long

/**
 * Personal auto quoting plugin. Default implementation of LOBs. This one ignores all
 * data for non-personal auto, so it _can_ be used with the combining/composing plugins.
 */
class PaQuotingPlugin implements ILobQuotingPlugin <PaAvailableCoveragesDTO> {
  private static final var LOGGER = Logger.forCategory(ILobQuotingPlugin.Type.QName)

  @InjectableNode
  construct() {

  }

  override function getQuoteDetails(pp : PolicyPeriod) : PaAvailableCoveragesDTO {
    if (!pp.PersonalAutoLineExists) {
      return null
    }

    final var paLine = pp.PersonalAutoLine

    final var res = new PaAvailableCoveragesDTO()
    res.LineCoverages = getLineCoverages(pp, paLine)
      .map(\cov -> CoverageUtil.toDTO(cov, paLine, \c ->costOfLineCov(c)))
    res.VehicleCoverages = paLine.Vehicles
      .sortBy(\ p -> p.VehicleNumber)
      .map(\v -> toDTO(v, pp, paLine))
    return res
  }



  override function updateCustomQuote(period: PolicyPeriod, update : PaAvailableCoveragesDTO) {
    if (!period.PersonalAutoLineExists) {
      return
    }

    final var paLine = period.PersonalAutoLine

    CoverageUtil.updateFrom(paLine, getLineCoverages(period, paLine), update.LineCoverages)
    final var vehicleSpecs = update.VehicleCoverages.partitionUniquely( \ i -> i.PublicID)
    paLine.Vehicles.each(\v -> {
      final var vupdate = vehicleSpecs.get(v.PublicID)
      if (update == null) {
        throw new IllegalArgumentException("Cannot find coverage spec for vehicle " + v.PublicID)
      }
      updateCustomVehicle(period, paLine, v, vupdate)
    })
  }

  override function generateVariants(base: PolicyPeriod) {
    if(!base.PersonalAutoLineExists) {
      return
    }

    for (offering in base.Policy.Product.Offerings.where( \ anOffering -> anOffering.isOfferingAvailable(base))) {
      try{
        LOGGER.debug("creating new policy period for offering "+offering.Name)
        createOffering(base, offering.Name, offering)
      }
      catch(exception : java.lang.Exception) {
        LOGGER.error("Error creating period for offering " + offering.Name, exception)
      }
    }
  }

  /**
   * Converts personal vehilce to DTO.
   */
  protected function toDTO(v : PersonalVehicle, pp : PolicyPeriod, line : PersonalAutoLine) : VehicleCoverageDTO {
    final var res = new VehicleCoverageDTO()
    res.FixedId = v.FixedId.Value
    res.PublicID = v.PublicID
    res.VehicleName = getVehicleName(v)
    res.Coverages = getVehicleCoverages(pp, line, v)
      .map(\cov -> CoverageUtil.toDTO(cov, v, \ c -> costOfVehicle(c)))

    return res
  }



  protected function updateCustomVehicle(pp : PolicyPeriod, line : PersonalAutoLine, v : PersonalVehicle, update : VehicleCoverageDTO) {
    CoverageUtil.updateFrom(v, getVehicleCoverages(pp, line, v), update.Coverages)
  }



  protected function getLineCoverages(pp : PolicyPeriod, line :  PersonalAutoLine) : CoveragePattern[] {
    final var liabilityCoverageCategory = line.Pattern.getCoverageCategoryByCodeIdentifier("PAPLiabGrp")
    final var pipCoverageCategory = line.Pattern.getCoverageCategoryByCodeIdentifier("PAPip")
    final var liabilityCoverages = liabilityCoverageCategory.coveragePatternsForEntity(PersonalAutoLine).where(\ c -> line.isCoverageSelectedOrAvailable(c))

    return liabilityCoverages.concat(pipCoverageCategory.coveragePatternsForEntity(PersonalAutoLine).where(\ c -> line.isCoverageSelectedOrAvailable(c)))
  }


  protected function getVehicleCoverages(pp : PolicyPeriod, line : PersonalAutoLine, v : PersonalVehicle):CoveragePattern[] {
    final var coverageCategory = line.Pattern.getCoverageCategoryByCodeIdentifier("PAPPhysDamGrp")
    return coverageCategory.coveragePatternsForEntity(entity.PersonalVehicle).where(\ c -> v.isCoverageSelectedOrAvailable(c))
  }


  /**
   * Calculates total cost of the coverage for line-level coverages.
   */
  protected function costOfLineCov(cov : Coverage) : AmountDTO {
    final var pacov = cov as PersonalAutoCov
    return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(pacov.Costs))

  }


  /**
   * Calculates total cost of the coverage for vehicle-level coverage.
   */
  protected function costOfVehicle(cov : Coverage) : AmountDTO {
    final var autoCov = cov as PersonalVehicleCov
    return AmountDTO.fromMonetaryAmount(CurrencyOpUtil.sumArray(autoCov.Costs))
  }


  /** The display name for vehicles could potentially be overridden so this is included to be consistent with the frontend. */
  protected function getVehicleName(veh : PersonalVehicle) : String{
    var sb = new java.lang.StringBuffer()
    if (veh.Year != null) {
      sb.append(veh.Year as int).append(" ")
    }
    if (veh.Make.HasContent) {
      sb.append(veh.Make).append(" ")
    }
    if (veh.Model.HasContent) {
      sb.append(veh.Model).append(" ")
    }

    if (veh.LicensePlate.HasContent) {
      sb.append("(").append(veh.LicensePlate)
      if (veh.LicenseState != null) {
        sb.append("/").append(veh.LicenseState.Code)
      }
      sb.append(")")
    }

    if (sb.length() == 0) {
      sb.append(
        TranslateUtil.translate("displaykey.EntityName.PersonalVehicle.NewlyCreated")
      )
    }
    return sb.toString()
  }

  /**
   * Creates a new offering.
   */
  protected function createOffering(base : PolicyPeriod, name : String, offering : Offering) : PolicyPeriod {
    final var newPeriod = base.createDraftMultiVersionJobBranch()
    clearCoverages(newPeriod)
    base.Submission.addToPeriods(newPeriod)
    newPeriod.getJobProcessInternal().start()
    newPeriod.BranchName = name
    OfferingUtil.setOffering(newPeriod, offering)
    return newPeriod
  }


  /**
   * Revomes all coverages from all coverables on a policy period.
   * When an UW rule is broken during quoting, the user is permitted to use the submission number to
   * re-enter the quoting wizard and not have to re-enter all their details. The user is also permitted to
   * change the information which they entered. If they happen to change the information which previously broke
   * the UW rule, to a value which no longer breaks the UW rule, they can re-attempt a quote. In order to avoid
   * the new quotes' Premium, Standard and Custom branches having the same coverages as the Basic branch,
   * the clearCoverages function must be called for each of the branches.
   */
  private function clearCoverages(p: PolicyPeriod):PolicyPeriod {
    for (cov in p.AllCoverables*.CoveragesFromCoverable){
      cov.remove()
    }
    return p
  }
}
