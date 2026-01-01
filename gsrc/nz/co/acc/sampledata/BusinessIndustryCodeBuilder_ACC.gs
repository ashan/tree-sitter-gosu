package nz.co.acc.sampledata

uses gw.rating.rtm.builders.AbstractFactorRowBuilder

/**
 * Builder class to create a BusinessIndustryCode_ACC instance.
 */
class BusinessIndustryCodeBuilder_ACC extends AbstractFactorRowBuilder<BusinessIndustryCode_ACC, BusinessIndustryCodeBuilder_ACC> {

  function withBusinessIndustryCode(businessIndustryCode : String) : BusinessIndustryCodeBuilder_ACC {
    set(BusinessIndustryCode_ACC#BusinessIndustryCode, businessIndustryCode)
    return this
  }

  function withBusinessIndustryDescription(businessIndustryDescription : String) : BusinessIndustryCodeBuilder_ACC {
    set(BusinessIndustryCode_ACC#BusinessIndustryDescription, businessIndustryDescription)
    return this
  }

  function withStartDate(startDate : Date) : BusinessIndustryCodeBuilder_ACC {
    set(BusinessIndustryCode_ACC#StartDate, startDate)
    return this
  }

  function withEndDate(endDate : Date) : BusinessIndustryCodeBuilder_ACC {
    set(BusinessIndustryCode_ACC#EndDate, endDate)
    return this
  }

  function withClassificationUnit(classificationUnit : ClassificationUnit_ACC) : BusinessIndustryCodeBuilder_ACC {
    set(BusinessIndustryCode_ACC.Type.TypeInfo.getProperty("ClassificationUnit_ACC"), classificationUnit)
    return this
  }
}