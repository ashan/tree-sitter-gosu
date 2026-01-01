package edge.capabilities.quote.lob.commercialproperty.quoting

uses edge.capabilities.quote.lob.ILobQuotingPlugin
uses edge.capabilities.quote.lob.commercialproperty.quoting.dto.CpAvailableCoveragesDTO
uses edge.capabilities.quote.lob.commercialproperty.util.BuildingCoveragesUtil
uses edge.di.annotations.InjectableNode
uses java.util.ArrayList
uses gw.api.util.Logger
uses edge.capabilities.quote.quoting.util.OfferingUtil
uses gw.api.productmodel.Offering
uses java.lang.IllegalArgumentException
uses edge.capabilities.quote.lob.commercialproperty.quoting.dto.BuildingCoverageDTO


class CpQuotingPlugin implements ILobQuotingPlugin <CpAvailableCoveragesDTO> {

  private static final var LOGGER = Logger.forCategory(ILobQuotingPlugin.Type.QName)
  @InjectableNode
  construct() {
  }

  override function getQuoteDetails(pp: PolicyPeriod): CpAvailableCoveragesDTO {
    if (!pp.CPLineExists) {
      return null
    }

    final var cpLine = pp.CPLine

    final var res = new CpAvailableCoveragesDTO()

    var al = new ArrayList<BuildingCoverageDTO>()
    cpLine.CPLocations.each(\loc -> loc.Buildings.map(\bldg -> al.add(BuildingCoveragesUtil.toDTO(bldg, cpLine))))
    res.BuildingCoverages = al.toTypedArray()

    return res
  }

  override function updateCustomQuote(period: PolicyPeriod, update: CpAvailableCoveragesDTO) {
    if (!period.CPLineExists) {
      return
    }

    final var cpLine = period.CPLine



    final var bldgSpecs = update.BuildingCoverages.partitionUniquely(\i -> i.PublicID)
    cpLine.CPLocations.each(\loc -> loc.Buildings.each(\bldg -> {
      final var bldgupdate = bldgSpecs.get(bldg.PublicID)
      if (update == null) {
        throw new IllegalArgumentException("Cannot find coverage spec for building " + bldg.PublicID)
      }
      BuildingCoveragesUtil.updateCustomBuilding(cpLine, bldg, bldgupdate)
    }))
  }



  override function generateVariants(base: PolicyPeriod) {
    //to respect interface contract but Commercial property only need Custom quote and no BASE like PA or HO
    return
  }

  /**
   * Creates a new offering.
   */
  protected function createOffering(base: PolicyPeriod, name: String, offering: Offering): PolicyPeriod {
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
  private function clearCoverages(p: PolicyPeriod): PolicyPeriod {
    for (cov in p.AllCoverables*.CoveragesFromCoverable) {
      cov.remove()
    }
    return p
  }
}
