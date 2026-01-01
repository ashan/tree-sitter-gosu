package nz.co.acc.lob.aep

uses gw.pl.currency.MonetaryAmount
uses gw.rating.worksheet.domain.WorksheetCalculation

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by ManubaF on 19/06/2017.
 */
enhancement AEPCostACCEnhancement: AEPCost_ACC {
  property get CUCode() : String {
    if(this typeis AEPWorkAccountLevyCost_ACC or
       this typeis AEPPartnershipPlanDiscountCost_ACC or
       this typeis AEPResidualWorkAccountLevyCost_ACC) {
      return this.AEPRateableCUData.CUCode
    }
    return null
  }

  property get CUDescription() : String {
    if(this typeis AEPWorkAccountLevyCost_ACC or
       this typeis AEPPartnershipPlanDiscountCost_ACC or
       this typeis AEPResidualWorkAccountLevyCost_ACC) {
      return this.AEPRateableCUData.CUDescription
    }
    return null
  }

  function findWorkSheetParametersFromCost(parameterName : String) : BigDecimal {
    if(this typeis AEPStopLossLevyCost_ACC) {
      var worksheet = (this.BranchUntyped as PolicyPeriod).getWorksheetFor(this)
      if (worksheet != null) {
        var calculationWorksheetEntries = worksheet.AllWorksheetEntries.where(\elt -> elt typeis WorksheetCalculation)
        if (calculationWorksheetEntries != null) {
          var calculationParam = calculationWorksheetEntries.where(\elt1 -> (elt1 as WorksheetCalculation).StoreLocation == parameterName)
          if (calculationParam != null) {
            var calculationValue = (calculationParam.first() as WorksheetCalculation).Result as BigDecimal
            return calculationValue.setScale(2, RoundingMode.HALF_UP) ?: BigDecimal.ZERO
          }
        }
      }
    }
    return null
  }

  function copyStopLossDataToAEPStopLossLevyCost(stopLossLimit : AEPStopLossResults_ACC) {
    if (this typeis AEPStopLossLevyCost_ACC) {
      this.CalcStopLossLimit = stopLossLimit.CalcStopLossLimit.setScale(2, RoundingMode.HALF_UP)
      this.StopLossLimitWorkAccLevyRatio = stopLossLimit.StopLossLimitWorkAccLevyRatio.setScale(2, RoundingMode.HALF_UP)
    }
  }

  function getCalculatedStopLossLimitForDisplay() : MonetaryAmount {
    if (this typeis AEPStopLossLevyCost_ACC) {
      return new gw.pl.currency.MonetaryAmount(this.CalcStopLossLimit ?: BigDecimal.ZERO, Currency.TC_NZD)
    } else {
      return new gw.pl.currency.MonetaryAmount(BigDecimal.ZERO, Currency.TC_NZD)
    }
  }

  function getStopLossLimitWorkAccLevyRatioForDisplay() : BigDecimal {
    if (this typeis AEPStopLossLevyCost_ACC) {
      return this.StopLossLimitWorkAccLevyRatio
    } else {
      return null
    }
  }
}
