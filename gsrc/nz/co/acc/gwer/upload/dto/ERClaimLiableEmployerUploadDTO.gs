package nz.co.acc.gwer.upload.dto

uses java.math.BigDecimal

/*--- ER Data Objects ---*/
class ERClaimLiableEmployerUploadDTO {
  public var claimNumber: String as ClaimNumber = null
  public var claimantACCNumber: String as ClaimantACCNumber = null
  public var claimantName: String as ClaimantName = null
  public var injuryDate: Date as InjuryDate = null
  public var claimFundCode: String as ClaimFundCode = null
  public var claimFundDesc: String as ClaimFundDesc = null
  public var acceptedDate: Date as AcceptedDate = null
  public var claimDesc: String as ClaimDesc = null
  public var accidentLocation: String as AccidentLocation = null
  public var coverDecision: String as CoverDecision = null
  public var isSensitive: Integer as IsSensitive = null
  public var isFatal: Integer as IsFatal = null
  public var isGradualProcess: Integer as IsGradualProcess = null
  public var isAdverse: Integer as IsAdverse = null
  public var experienceYear: Integer as ExperienceYear = null
  public var greatestModifiedDate: Date as GreatestModifiedDate = null
  public var cntExpInjury: Integer as CntExpInjury = null
  public var primaryCodingSystem: String as PrimaryCodingSystem = null
  public var primaryInjuryCode: String as PrimaryInjuryCode = null
  public var primaryInjuryDesc: String as PrimaryInjuryDesc = null
  public var accPolicyID_ACC: String as ACCPolicyID_ACC = null
  public var claimCUCode: String as ClaimCUCode = null
  public var percentLiable: BigDecimal as PercentLiable = null
  public var totalWCD_Yr1: BigDecimal as TotalWCD_Yr1 = null
  public var totalWCD_Yr2: BigDecimal as TotalWCD_Yr2 = null
  public var totalWCD_Yr3: BigDecimal as TotalWCD_Yr3 = null
  public var medicalSpend_Yr1: BigDecimal as MedicalSpend_Yr1 = null
  public var medicalSpend_Yr2: BigDecimal as MedicalSpend_Yr2 = null
  public var medicalSpend_Yr3: BigDecimal as MedicalSpend_Yr3 = null

  public override function toString(): String {
    return "ERClaimLiableEmployerUploadDTO{" +
        "claimNumber ='" + claimNumber + '\'' +
        ", claimantACCNumber ='" + claimantACCNumber + '\'' +
        ", claimantName ='" + claimantName + '\'' +
        ", injuryDate ='" + injuryDate + '\'' +
        ", claimFundCode ='" + claimFundCode + '\'' +
        ", claimFundDesc ='" + claimFundDesc + '\'' +
        ", acceptedDate ='" + acceptedDate + '\'' +
        ", claimDesc ='" + claimDesc + '\'' +
        ", accidentLocation ='" + accidentLocation + '\'' +
        ", coverDecision ='" + coverDecision + '\'' +
        ", isSensitive =" + isSensitive + '' +
        ", isFatal =" + isFatal + '' +
        ", isGradualProcess =" + isGradualProcess + '' +
        ", isAdverse =" + isAdverse + '' +
        ", experienceYear =" + experienceYear + '' +
        ", greatestModifiedDate ='" + greatestModifiedDate + '\'' +
        ", cntExpInjury =" + cntExpInjury + '' +
        ", primaryCodingSystem ='" + primaryCodingSystem + '\'' +
        ", primaryInjuryCode ='" + primaryInjuryCode + '\'' +
        ", primaryInjuryDesc ='" + primaryInjuryDesc + '\'' +
        ", aCCPolicyID_ACC ='" + accPolicyID_ACC + '\'' +
        ", claimCUCode ='" + claimCUCode + '\'' +
        ", percentLiable =" + percentLiable + '' +
        ", totalWCD_Yr1 =" + totalWCD_Yr1 + '' +
        ", totalWCD_Yr2 =" + totalWCD_Yr2 + '' +
        ", totalWCD_Yr3 =" + totalWCD_Yr3 + '' +
        ", medicalSpend_Yr1 =" + medicalSpend_Yr1 + '' +
        ", medicalSpend_Yr2 =" + medicalSpend_Yr2 + '' +
        ", medicalSpend_Yr3 =" + medicalSpend_Yr3 + '' +
        '}';
  }
}