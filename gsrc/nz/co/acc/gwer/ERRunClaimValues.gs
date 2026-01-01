package nz.co.acc.gwer

uses java.math.BigDecimal

class ERRunClaimValues {
  public var originalERRunLevyPayer : ERRunLevyPayer_ACC
  public var erRunLevyPayer : ERRunLevyPayer_ACC
  public var claimNumber : String
  public var claimantACCNumber : String
  public var claimantName : String
  public var injuryDate : Date
  public var claimFundCode : String
  public var claimFundDesc : String
  public var acceptedDate : Date
  public var claimDesc : String
  public var accidentLocation : String
  public var coverDecision : String
  public var isSensitive : Integer
  public var isFatal : Integer
  public var isGradualProcess : Integer
  public var isAdverse : Integer
  public var experienceYear : Integer
  public var greatestModifiedDate : Date
  public var cntExpInjury : Integer
  public var primaryCodingSystem : String
  public var primaryInjuryCode : String
  public var primaryInjuryDesc : String
  public var claimERParamCU : ERParamCU_ACC
  public var percentLiable : BigDecimal
  public var erParamFundCode : ERParamFundCode_ACC
  // Claim year based values
  public var totalWCD_Yr1 : BigDecimal
  public var totalWCD_Yr2 : BigDecimal
  public var totalWCD_Yr3 : BigDecimal
  public var medicalSpend_Yr1 : BigDecimal
  public var medicalSpend_Yr2 : BigDecimal
  public var medicalSpend_Yr3 : BigDecimal
  // Claim Derived Values
  public var uncappedWCD : BigDecimal
  public var cappedWCD : BigDecimal
  public var medicalSpend : BigDecimal
  public var exceedsMSTH : Integer
  public var derivedERParamCU : ERParamCU_ACC
  public var derivedCUReason : String
  public var isRiskMgmtQualifying : Integer
  public var isRehabMgmtQualifying : Integer
  public var isERGradual : Integer
  public var includeInFactor : Integer
  public var isNCDQualifying : Integer
  public var isERQualifying : Integer
  public var nonQualifyingReason : String
}