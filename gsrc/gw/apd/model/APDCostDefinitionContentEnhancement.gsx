package gw.apd.model

enhancement APDCostDefinitionContentEnhancement : APDCostDefinition {

  static function getCoverableCostCodes(cbl : APDCoverable): Set<CostCode> {
    final var codes = new HashSet<CostCode>()
    // cost for child coverables
    for (child in cbl.ChildCoverables) {
      codes.addAll(APDCostDefinition.getCoverableCostCodes(child))
    }
    // costs for all coverages
    codes.addAll(cbl.Coverages.arrays("CostDefinitions").toArray(new APDCoverageCostDefinition[0])*.CostCode.toSet())
    // costs for coverables
    codes.addAll(cbl.CostDefinitions*.CostCode.toSet())

    return codes
  }

  property get CostCodeFilterCandidates(): Set<CostCode> {
    final var codes = new HashSet<CostCode>()

    if (this typeis APDCoverageCostDefinition) {
      // costs calculated before this one on the current coverage
      codes.addAll(this.Coverage.CostDefinitions.where(\cd -> cd.PricingOrder < this.PricingOrder)*.CostCode.toSet())
      // costs calculated for coverages before this one
      for (costDef in this.Coverage.Coverable.Coverages.where(\c -> c.PricingOrder < this.Coverage.PricingOrder).arrays("CostDefinitions").toArray(new APDCoverageCostDefinition[0])) {
        codes.addAll(costDef.ContainerUsedCostCodes)
      }

    } else if (this typeis APDRiskCostDefinition) {
      // costs calculated before this one on the current coverable
      codes.addAll(this.Coverable.CostDefinitions.where(\cd -> cd.PricingOrder < this.PricingOrder)*.CostCode.toSet())
      // cost for all coverages belonging to this coverable
      for (costDef in this.Coverable.Coverages.arrays("CostDefinitions").toArray(new APDCoverageCostDefinition[0])) {
        codes.addAll(costDef.ContainerUsedCostCodes)
      }
      // cost for child coverables
      for (cbl in this.Coverable.ChildCoverables) {
        codes.addAll(APDCostDefinition.getCoverableCostCodes(cbl))
      }
    }
    return codes
  }
}
