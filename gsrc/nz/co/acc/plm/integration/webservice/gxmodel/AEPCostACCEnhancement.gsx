package nz.co.acc.plm.integration.webservice.gxmodel

uses entity.AEPCost_ACC
uses java.math.BigDecimal

/**
 * Created by jingZ on 27/07/2017.
 */
enhancement AEPCostACCEnhancement: AEPCost_ACC {

  property get StopLossLimit(): BigDecimal {
    if (this typeis AEPStopLossLevyCost_ACC) {
      return this.CalcStopLossLimit
    }else {
      return null
    }
  }

  property get WorkAccountLevyPercentage(): BigDecimal {
    if (this typeis AEPStopLossLevyCost_ACC) {
      return this.StopLossLimitWorkAccLevyRatio
    } else {
      return null
    }
  }
}
