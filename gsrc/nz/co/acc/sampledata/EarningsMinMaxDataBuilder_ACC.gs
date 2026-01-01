package nz.co.acc.sampledata

uses gw.pl.currency.MonetaryAmount
uses gw.rating.rtm.builders.AbstractFactorRowBuilder

/**
 * Builder class to create a EarningsMinMax_ACC instance.
 */
class EarningsMinMaxDataBuilder_ACC extends AbstractFactorRowBuilder<EarningsMinMaxData_ACC, EarningsMinMaxDataBuilder_ACC> {

  function withPolicyStartDate(startDate : Date) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#PolicyStartDate, startDate)
    return this
  }

  function withPolicyEndDate(endDate : Date) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#PolicyEndDate, endDate)
    return this
  }

  function withFullTimeMinimumCP(fullTimeMinimum: MonetaryAmount) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#FullTimeMinimumCP, fullTimeMinimum)
    return this
  }

  function withFullTimeMaximumCP(fullTimeMaximum: MonetaryAmount) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#FullTimeMaximumCP, fullTimeMaximum)
    return this
  }

  function withFullTimeMinimumCPX(fullTimeMinimumCPX: MonetaryAmount) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#FullTimeMinimumCPX, fullTimeMinimumCPX)
    return this
  }

  function withFullTimeMaximumCPX(fullTimeMaximumCPX: MonetaryAmount) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#FullTimeMaximumCPX, fullTimeMaximumCPX)
    return this
  }

  function withFinalMaximumWPS(finalMaximumWPS: MonetaryAmount) : EarningsMinMaxDataBuilder_ACC {
    set(EarningsMinMaxData_ACC#FinalMaximumWPS, finalMaximumWPS)
    return this
  }
}