package gw.apd.web

@Export
class APDPricingScreenUIHelper {

  private static var OPTION_DROPDOWN_TYPES : typekey.APDDropDownType[] = {APDDropDownType.TC_PACKAGE, APDDropDownType.TC_OPTION}

  static function getCostPricingWithEmptyBasisOptionValue(riskObj : APDRiskCoverable) : APDPricing[] {
    var onRiskObj : APDPricing[] = riskObj.CostPricing.where(\price -> price.PriceBasis == null && price.CostDefinition.Basis typeis APDTerm && OPTION_DROPDOWN_TYPES.contains(price.CostDefinition.Basis.DropDownType))
    var onRiskObjCoverages : APDPricing[] = riskObj.RiskCoverages.arrays("CostPricing").toArray(new APDRiskCovPricing[0]).where(\price -> price.PriceBasis == null && price.CostDefinition.Basis typeis APDTerm && OPTION_DROPDOWN_TYPES.contains(price.CostDefinition.Basis.DropDownType))
    return onRiskObj.concat(onRiskObjCoverages)
  }

  static function getEmptyBasisDisplayString(pricingList : APDPricing[]) : String {
    return String.join("', '",pricingList*.CostDefinition*.Basis.toSet()*.QualifiedLabel)
  }
}