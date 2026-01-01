package gw.apd.policy

enhancement APDRiskCovPricingContentEnhancement : APDRiskCovPricing {
  function syncExposurePricing() {
    var b = this.PriceBasis
    var basis = this.CostDefinition.Basis
    // if one of the terms is the basis, there are no exposures
    if (this.CostDefinition.CostingByExposure) {
      if (basis typeis APDExposureField) {
        // go through all exposures and add any exposure pricing that is missing
        this.RiskCoverage.RiskCoverable.ManualPolicyLine.RiskCoverables.arrays("RiskExposures").toArray(new APDRiskExposure[0]).where(\re -> re.Exposure == basis.Exposure).each(\re -> {
          if (not this.ExposurePrices.hasMatch(\ep -> ep.RiskExposure == re)) {
            var ep = new APDExposurePrice(this.Branch)
            ep.RiskExposure = re
            this.addToExposurePrices(ep)
          }
        })
        // delete any exposure pricing that has deleted exposure
        this.ExposurePrices.where(\ep -> ep.RiskExposure == null).each(\ep -> ep.remove())
      } else if (basis typeis APDField) {
        // go through all exposures and add any exposure pricing that is missing
        this.RiskCoverage.RiskCoverable.ManualPolicyLine.RiskCoverables.where(\cbl -> cbl.Coverable == basis.Coverable).each(\cbl -> {
          if (not this.ExposurePrices.hasMatch(\ep -> ep.RiskCoverable == cbl)) {
            var ep = new APDExposurePrice(this.Branch)
            ep.RiskCoverable = cbl
            this.addToExposurePrices(ep)
          }
        })
        // delete any exposure pricing that has deleted exposure
        this.ExposurePrices.where(\ep -> ep.RiskCoverable == null).each(\ep -> ep.remove())
      }
    } else this.ExposurePrices.each(\ep -> ep.remove())
  }
}
