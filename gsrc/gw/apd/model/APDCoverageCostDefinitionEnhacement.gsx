package gw.apd.model

enhancement APDCoverageCostDefinitionEnhacement : APDCoverageCostDefinition {

  function moveUp() {
    final var previousCostDefinition = this.Coverage.CostDefinitions.firstWhere(\cd -> cd.PricingOrder == this.PricingOrder - 1)
    if (previousCostDefinition != null) {
      final var bundle = gw.transaction.Transaction.Current
      final var currCost = this.Bundle == null ? bundle.add(this) : this
      final var prevCost = previousCostDefinition.Bundle == null ? bundle.add(previousCostDefinition) : previousCostDefinition
      currCost.PricingOrder -= 1
      prevCost.PricingOrder += 1
    }
  }

  function moveDown() {
    final var nextCostDefinition = this.Coverage.CostDefinitions.firstWhere(\cd -> cd.PricingOrder == this.PricingOrder + 1)
    if (nextCostDefinition != null) {
      final var bundle = gw.transaction.Transaction.Current
      final var currCost = this.Bundle == null ? bundle.add(this) : this
      final var nextCost = nextCostDefinition.Bundle == null ? bundle.add(nextCostDefinition) : nextCostDefinition
      nextCost.PricingOrder -= 1
      currCost.PricingOrder += 1
    }
  }
}
