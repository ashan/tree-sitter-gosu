package nz.co.acc.sampledata

uses gw.rating.rtm.builders.AbstractFactorRowBuilder

uses java.math.BigDecimal

/**
 * Builder class to create a InflationAdjustment_ACC instance.
 */
class InflationAdjustmentBuilder_ACC extends AbstractFactorRowBuilder<InflationAdjustment_ACC, InflationAdjustmentBuilder_ACC> {

  function withPolicyStartDate(startDate : Date) : InflationAdjustmentBuilder_ACC {
    set(InflationAdjustment_ACC#PolicyStartDate, startDate)
    return this
  }

  function withPolicyEndDate(endDate : Date) : InflationAdjustmentBuilder_ACC {
    set(InflationAdjustment_ACC#PolicyEndDate, endDate)
    return this
  }

  function withRatePercent(ratePercent : BigDecimal) : InflationAdjustmentBuilder_ACC {
    set(InflationAdjustment_ACC#RatePercent, ratePercent)
    return this
  }

}