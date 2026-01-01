package gw.apd.model

/**
 * Agile Product Developer
 */
enhancement APDCoverageClaimEnhancement: APDCoverageClaim {

  property get RestrictedPerilList() : String {
    var perilList : String
    var perils = this.ClaimCostCategory.RestrictedPerils*.Peril.where(\p -> this.Coverage.Perils.hasMatch(\cp -> cp.Peril == p))
    perils.eachWithIndex(\p, i -> {
      if (i == 0) perilList = p.Name
      else perilList.concat(", " + p.Name)
    })
    return perilList
  }
}
