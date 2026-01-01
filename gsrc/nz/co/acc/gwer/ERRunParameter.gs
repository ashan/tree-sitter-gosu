package nz.co.acc.gwer

uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.lob.common.DateUtil_ACC

uses java.math.BigDecimal
uses java.math.MathContext

class ERRunParameter {
  public var claimActivityPeriodEndDate : Date
  public var experiencePeriodStartDate : Date
  public var experiencePeriodEndDate : Date
  public var includeDSuffix : Boolean
  public var includeSSuffix : Boolean
  public var minAnnualLevyThreshold : Integer
  public var medicalSpendThreshold : Integer
  public var largeEmpEarningsThreshold : Integer
  public var lowerExpModCap : BigDecimal
  public var upperExpModCap : BigDecimal
  public var weeklyCompDaysCap : Integer
  public var noClaimsDiscountDiscount : BigDecimal
  public var noClaimsDiscountLoading : BigDecimal
  public var noClaimsThresholdLower : BigDecimal
  public var noClaimsThresholdUpper : BigDecimal
  public var offBalAdjLargeEmp : Integer
  public var offBalAdjMediumEmp : Integer
  public var weightToRehabComponent : BigDecimal
  public var weightToRiskComponent : BigDecimal
  public var levyYear : Integer
  public var periodStart : Date
  public var periodEnd : Date
  public var transferPeriodEndDate : Date
  private var format = "yyyyMMdd"

  construct(levyApplicationYear :  Integer) {
    this.levyYear = levyApplicationYear
    this.periodStart = DateUtil_ACC.createDateFromString(String.valueOf(levyApplicationYear-1)+"0401", format)
    this.periodEnd = DateUtil_ACC.createDateFromString(String.valueOf(levyApplicationYear) + "0331", format)
    this.transferPeriodEndDate = DateUtil_ACC.createDateFromString(String.valueOf(levyApplicationYear-1)+"0331", format)
    RunParameters = levyApplicationYear
  }

  private property set RunParameters(levyApplicationYear : Integer) {
    var mc = new MathContext(8)
    var paramCode : ERParametersCode_ACC
    var result = Query.make(ERParamValue_ACC)
        .compare(ERParamValue_ACC#LevyApplicationYear, Relop.Equals, levyApplicationYear)
        .select()
    for (erParam in result) {
      paramCode = erParam.ERParameterCode
      switch (paramCode) {
        case ERParametersCode_ACC.TC_ECAD:
          claimActivityPeriodEndDate = DateUtil_ACC.createDateFromString(erParam.ERParameterValue, format)
          break;
        case ERParametersCode_ACC.TC_ERSD:
          experiencePeriodStartDate = DateUtil_ACC.createDateFromString(erParam.ERParameterValue, format)
          break;
        case ERParametersCode_ACC.TC_ERED:
          experiencePeriodEndDate = DateUtil_ACC.createDateFromString(erParam.ERParameterValue, format)
          break;
        case ERParametersCode_ACC.TC_IDSX:
          if (erParam.ERParameterValue.equalsIgnoreCase("Y")) {
            includeDSuffix = Boolean.TRUE
          } else {
            includeDSuffix = Boolean.FALSE
          }
          break;
        case ERParametersCode_ACC.TC_ISSX:
          if (erParam.ERParameterValue.equalsIgnoreCase("Y")) {
            includeSSuffix = Boolean.TRUE
          } else {
            includeSSuffix = Boolean.FALSE
          }
          break;
        case ERParametersCode_ACC.TC_MALT:
          minAnnualLevyThreshold = Integer.valueOf(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_MSTH:
          medicalSpendThreshold = Integer.valueOf(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_LEET:
          largeEmpEarningsThreshold = Integer.valueOf(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_LEMC:
          lowerExpModCap = new BigDecimal(erParam.ERParameterValue).divide(100, mc)
          break;
        case ERParametersCode_ACC.TC_UEMC:
          upperExpModCap = new BigDecimal(erParam.ERParameterValue).divide(100, mc)
          break;
        case ERParametersCode_ACC.TC_WCDC:
          weeklyCompDaysCap = Integer.valueOf(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_NCDD:
          noClaimsDiscountDiscount = new BigDecimal(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_NCDL:
          noClaimsDiscountLoading = new BigDecimal(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_NCTL:
          noClaimsThresholdLower = new BigDecimal(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_NCTU:
          noClaimsThresholdUpper = new BigDecimal(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_OBAL:
          offBalAdjLargeEmp = Integer.valueOf(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_OBAM:
          offBalAdjMediumEmp = Integer.valueOf(erParam.ERParameterValue)
          break;
        case ERParametersCode_ACC.TC_WREC:
          weightToRehabComponent = new BigDecimal(erParam.ERParameterValue).divide(100, mc)
          break;
        case ERParametersCode_ACC.TC_WRIC:
          weightToRiskComponent = new BigDecimal(erParam.ERParameterValue).divide(100, mc)
          break;
      }
    }
  }
}