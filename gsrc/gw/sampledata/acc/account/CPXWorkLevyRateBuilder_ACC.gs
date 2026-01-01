package gw.sampledata.acc.account

uses gw.rating.rtm.builders.AbstractFactorRowBuilder

uses java.math.BigDecimal

uses entity.ClassificationUnit_ACC

/**
 * Builder class to create a CPXWorkLevyRateBuilder_ACC instance.
 */
class CPXWorkLevyRateBuilder_ACC extends AbstractFactorRowBuilder<CPXWorkLevyRate_ACC, CPXWorkLevyRateBuilder_ACC> {

  function withClassificationUnitCode(classificationUnitCode : String) : CPXWorkLevyRateBuilder_ACC {
    set(CPXWorkLevyRate_ACC#ClassificationUnitCode, classificationUnitCode)
    return this
  }

  function withAbatedRate(rate : BigDecimal) : CPXWorkLevyRateBuilder_ACC {
    set(CPXWorkLevyRate_ACC#AbatedRate, rate)
    return this
  }

  function withLLWCRate(rate : BigDecimal) : CPXWorkLevyRateBuilder_ACC {
    set(CPXWorkLevyRate_ACC#LLWCRate, rate)
    return this
  }

  function withStartDate(startDate : Date) : CPXWorkLevyRateBuilder_ACC {
    set(CPXWorkLevyRate_ACC#StartDate, startDate)
    return this
  }

  function withEndDate(endDate : Date) : CPXWorkLevyRateBuilder_ACC {
    set(CPXWorkLevyRate_ACC#EndDate, endDate)
    return this
  }

  function withClassificationUnit(classificationUnit : ClassificationUnit_ACC) : CPXWorkLevyRateBuilder_ACC {
    set(CPXWorkLevyRate_ACC.Type.TypeInfo.getProperty("ClassificationUnit_ACC"), classificationUnit)
    return this
  }
}