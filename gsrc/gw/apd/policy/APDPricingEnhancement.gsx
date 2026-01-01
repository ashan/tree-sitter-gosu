package gw.apd.policy

uses gw.apd.rating.APDCostData
uses gw.apd.rating.APDRiskCostData
uses gw.apd.rating.APDRiskCovCostData
uses gw.api.util.LocaleUtil

uses java.math.BigDecimal

uses entity.APDRiskCoverable
uses typekey.Currency
uses entity.APDPricing

/**
 * Agile Product Developer
 */
enhancement APDPricingEnhancement: APDPricing {

  property get Currency() : Currency {
    if (this typeis APDRiskCovPricing) {
      return this.RiskCoverage.Currency
    } else if (this typeis APDRiskPricing) {
      return this.RiskCoverable.PreferredCoverageCurrency
    }
    // this is the default if all else fails
    return this.Branch.PreferredCoverageCurrency
  }

  function priorCostCurrenciesFor(costDatas : List<APDCostData>) : Currency[] {
    return getAllPriorCosts(costDatas)*.Currency.toSet().toTypedArray()
  }

  property get PriceBasis() : BigDecimal {
    if (this.CostDefinition.isCumulativeCostBasis()) return null

    final var basisField = this.CostDefinition.Basis
    var riskBasis : APDRiskField
    var termBasis : APDRiskTerm
    var exposureBases : APDRiskExposureField[]
    var riskBases : APDRiskField[]
    if (basisField != null) {
      if (basisField typeis APDTerm) { // can only be a term of the current coverage
        if (this typeis APDRiskCovPricing) {
          termBasis = this.RiskCoverage.RiskTerms.firstWhere(\rt -> rt.Attribute == basisField)
        }
      } else { // can be a field from any exposure or coverable/entity in the "tree"
        var root : APDRiskCoverable
        if (this typeis APDRiskPricing) {
          root = this.RiskCoverable
        } else if (this typeis APDRiskCovPricing) {
          root = this.RiskCoverage.RiskCoverable
        }
        if (basisField typeis APDField) {
          riskBasis = root.RiskFields.firstWhere(\rf -> rf.Attribute == basisField)
          if (riskBasis == null) {
            riskBases = root.AllRiskCoverables.arrays("RiskFields").toArray(new APDRiskField[0]).where(\rf -> rf.Attribute == basisField)
          }
        } else if (basisField typeis APDExposureField) {
          exposureBases = root.AllRiskExposures.arrays("Fields").toArray(new APDRiskExposureField[0]).where(\rt -> rt.Attribute == basisField)
        }
      }
      if (riskBasis != null) {
        switch (riskBasis.Attribute.Type) {
          case TC_INTEGER :     return riskBasis.IntegerValue
          case TC_BIGDECIMAL :  return riskBasis.DecimalValue
          case TC_MONEY:        return riskBasis.DecimalValue
        }
      }
      if (termBasis != null) {
        switch (termBasis.Attribute.Type) {
          case TC_INTEGER :     return termBasis.IntegerValue
          case TC_BIGDECIMAL :  return termBasis.DecimalValue
          case TC_MONEY:        return termBasis.DecimalValue
          case TC_TYPEKEY:
            if (termBasis.CodeValue.Values.HasElements) {
              switch (termBasis.CodeValue.Values.first().DropdownColumn.ValueType) {
                case TC_MONEY:
                case TC_PERCENT:
                case TC_OTHER:    return termBasis.CodeValue.Values.first().DecimalValue
                default:          return termBasis.CodeValue.Values.first().IntegerValue
              }
            } else return null
        }
      }
      if (riskBases != null) {
        switch (riskBases.first().Attribute.Type) {
          case TC_INTEGER :     return riskBases*.IntegerValue.fold(\elt1, elt2 -> elt1 + elt2) ?: 0
          case TC_BIGDECIMAL :  return riskBases*.DecimalValue.fold(\elt1, elt2 -> elt1 + elt2) ?: 0
          case TC_MONEY:        return riskBases*.DecimalValue.fold(\elt1, elt2 -> elt1 + elt2) ?: 0
        }
      }
      if (exposureBases != null) {
        switch (exposureBases.first().Attribute.Type) {
          case TC_INTEGER :     return exposureBases*.IntegerValue.fold(\elt1, elt2 -> elt1 + elt2) ?: 0
          case TC_BIGDECIMAL :  return exposureBases*.DecimalValue.fold(\elt1, elt2 -> elt1 + elt2) ?: 0
          case TC_MONEY:        return exposureBases*.DecimalValue.fold(\elt1, elt2 -> elt1 + elt2) ?: 0
        }
      }
    }
    return 1
  }

  function getAdjustedRate(baseRate : BigDecimal) : BigDecimal {
    return baseRate
  }

  property get ChargeGroup() : String {
    var grouping : String
    gw.api.util.LocaleUtil.runAsCurrentLanguage(LocaleUtil.DefaultLanguage, \ -> {

    if (this typeis APDRiskPricing) { // coverable costs
      if (this.CostDefinition.SeparateCollection) { // itemised cost
        if (this.RiskCoverable typeis APDRiskPolicyLine) {
          grouping = this.CostDefinition.CostCode.CostName
        } else {
          grouping = this.RiskCoverable.DisplayName + "|" + this.CostDefinition.CostCode.CostName
        }
      } else if (this.RiskCoverable.Coverable.SeparateCollection) { // itemised coverable
        grouping = this.RiskCoverable.DisplayName
      }
    } else if (this typeis APDRiskCovPricing) { // coverage costs
      if (this.CostDefinition.SeparateCollection) { // itemised cost
        if (this.RiskCoverage.RiskCoverable typeis APDRiskPolicyLine) {
          grouping = this.RiskCoverage.Coverage.Name + "|" + this.CostDefinition.CostCode.CostName
        } else {
          grouping = this.RiskCoverage.RiskCoverable.DisplayName + "|" + this.RiskCoverage.Coverage.Name + "|" + this.CostDefinition.CostCode.CostName
        }
      } else if (this.RiskCoverage.Coverage.SeparateCollection) { // itemised coverage
        if (this.RiskCoverage.RiskCoverable typeis APDRiskPolicyLine) {
          grouping = this.RiskCoverage.Coverage.Name
        } else {
          grouping = this.RiskCoverage.RiskCoverable.DisplayName + "|" + this.RiskCoverage.Coverage.Name
        }
      } else if (this.RiskCoverage.RiskCoverable.Coverable.SeparateCollection) { // itemised coverable
        grouping = this.RiskCoverage.RiskCoverable.DisplayName
      }
    }

    })
    return grouping
  }

  property get BillGroup() : String {
    var grouping : String
    gw.api.util.LocaleUtil.runAsCurrentLanguage(LocaleUtil.DefaultLanguage, \ -> {

      if (this typeis APDRiskPricing) { // coverable costs
        if (this.CostDefinition.SeparateBilling) { // itemised cost
          if (this.RiskCoverable typeis APDRiskPolicyLine) {
            grouping = this.CostDefinition.CostCode.CostName
          } else {
            grouping = this.RiskCoverable.DisplayName + "|" + this.CostDefinition.CostCode.CostName
          }
        } else if (this.RiskCoverable.Coverable.SeparateBilling) { // itemised coverable
          grouping = this.RiskCoverable.DisplayName
        }
      } else if (this typeis APDRiskCovPricing) { // coverage costs
        if (this.CostDefinition.SeparateBilling) { // itemised cost
          if (this.RiskCoverage.RiskCoverable typeis APDRiskPolicyLine) {
            grouping = this.RiskCoverage.Coverage.Name + "|" + this.CostDefinition.CostCode.CostName
          } else {
            grouping = this.RiskCoverage.RiskCoverable.DisplayName + "|" + this.RiskCoverage.Coverage.Name + "|" + this.CostDefinition.CostCode.CostName
          }
        } else if (this.RiskCoverage.Coverage.SeparateBilling) { // itemised coverage
          if (this.RiskCoverage.RiskCoverable typeis APDRiskPolicyLine) {
            grouping = this.RiskCoverage.Coverage.Name
          } else {
            grouping = this.RiskCoverage.RiskCoverable.DisplayName + "|" + this.RiskCoverage.Coverage.Name
          }
        } else if (this.RiskCoverage.RiskCoverable.Coverable.SeparateBilling) { // itemised coverable
          grouping = this.RiskCoverage.RiskCoverable.DisplayName
        }
      }

    })
    return grouping
  }

  property get CostCode() : CostCode {
    return this.CostDefinition.CostCode
  }

  function calculateAmount(adjustedRate : BigDecimal, basis : BigDecimal) : BigDecimal {
    if (basis == 0 or basis == null) {
      return 0
    }
    var scaledBasis = basis
    switch (this.CostDefinition.RatingScale) {
      case RatingScale.TC_1000 : scaledBasis /= 10
      case RatingScale.TC_100 :  scaledBasis /= 100
      case RatingScale.TC_1 :
    }
    return scaledBasis * adjustedRate
  }

  function getFullBasis(costDatas : List<APDCostData>, currency : Currency) : BigDecimal {
    if (this.CostDefinition.isCumulativeCostBasis()) {
      final var priorCosts = getAllPriorCosts(costDatas)
      // apply filters
      priorCosts.removeAll(priorCosts.where(\cd -> cd.Currency != currency))
      return priorCosts*.ActualTermAmount.sum() //is this set yet? Looking for the magic that is overrideable costs!
    }

    return this.PriceBasis

  }

  function getFullBasis(costDatas : List<APDCostData>) : BigDecimal {
    return this.getFullBasis(costDatas, this.Currency)
  }

  private function getAllPriorCosts(costDatas : List<APDCostData>) : List<APDCostData> {
    if (this.CostDefinition.isCumulativeCostBasis()) {
      final var priorCosts = new ArrayList<APDCostData>()
      if (this typeis APDRiskCovPricing) {
        // coverage costs calculated before this one on the current coverage
        priorCosts.addAll(costDatas.whereTypeIs(APDRiskCovCostData).where(\cd -> cd.RiskCoverage == this.RiskCoverage).toList())
      } else if (this typeis APDRiskPricing) {
        // costs for this coverable (including child coverages) and all child coverables
        priorCosts.addAll(this.coverableCosts(costDatas, this.RiskCoverable))
      }
      // apply filters
      if (this.CostDefinition.JurisdictionFilter != null) {
        var nonmatching = priorCosts.where(\cd -> (cd as APDRiskCostData).RiskCoverable.CoverableState != this.CostDefinition.JurisdictionFilter)
        priorCosts.removeAll(nonmatching)
      }
      if (this.CostDefinition.RateAmountTypeFilter != null) {
        priorCosts.removeAll(priorCosts.where(\cd -> cd.RateAmountType != this.CostDefinition.RateAmountTypeFilter))
      }
      if (this.CostDefinition.CostCodeFilters.Count > 0) {
        var nonmatching = priorCosts.whereTypeIs(APDCostData).where(\cd -> not this.CostDefinition.CostCodeFilters*.CostCode.hasMatch(\cc -> cc == cd.CostCode))
        priorCosts.removeAll(nonmatching)
      }
      return priorCosts
    }
    return new ArrayList<APDCostData>()
  }

  function coverableCosts(costDatas : List<APDCostData>, cbl : APDRiskCoverable) : List<APDCostData> {
    final var priorCosts = new ArrayList<APDCostData>()
    // cost for child coverables
    for (child in cbl.ChildRiskCoverables) {
      priorCosts.addAll(this.coverableCosts(costDatas, child))
    }
    // coverage costs the coverable or any coverage on this coverable
    priorCosts.addAll((costDatas.whereTypeIs(APDRiskCostData).where(\cd -> cd.RiskCoverable == cbl) as List<APDCostData>)
        .union(costDatas.whereTypeIs(APDRiskCovCostData).where(\cd -> cd.RiskCoverage.RiskCoverable == cbl)).toList())

    return priorCosts
  }

}
