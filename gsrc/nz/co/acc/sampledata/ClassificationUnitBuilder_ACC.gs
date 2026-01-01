package nz.co.acc.sampledata

uses gw.api.financials.CurrencyAmount
uses gw.pl.currency.MonetaryAmount
uses gw.rating.rtm.builders.AbstractFactorRowBuilder

uses java.math.BigDecimal

/**
 * Builder class to create a ClassificationUnit_ACC instance.
 */
class ClassificationUnitBuilder_ACC extends AbstractFactorRowBuilder<ClassificationUnit_ACC, ClassificationUnitBuilder_ACC> {

  function withClassificationUnitCode(classificationUnitCode : String) : ClassificationUnitBuilder_ACC {
    set(ClassificationUnit_ACC#ClassificationUnitCode, classificationUnitCode)
    return this
  }

  function withClassificationUnitDescription(classificationUnitDescription : String) : ClassificationUnitBuilder_ACC {
    set(ClassificationUnit_ACC#ClassificationUnitDescription, classificationUnitDescription)
    return this
  }

  function withReplacementLabourCost(replacementLabourCost : MonetaryAmount) : ClassificationUnitBuilder_ACC {
    set(ClassificationUnit_ACC#ReplacementLabourCost, replacementLabourCost)
    return this
  }

  function withStartDate(startDate : Date) : ClassificationUnitBuilder_ACC {
    set(ClassificationUnit_ACC#StartDate, startDate)
    return this
  }

  function withEndDate(endDate : Date) : ClassificationUnitBuilder_ACC {
    set(ClassificationUnit_ACC#EndDate, endDate)
    return this
  }

  function withPublicID(publicID : String) : ClassificationUnitBuilder_ACC {
    set(ClassificationUnit_ACC#PublicID, publicID)
    return this
  }
}