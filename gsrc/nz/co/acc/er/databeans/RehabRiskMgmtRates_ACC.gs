package nz.co.acc.er.databeans

uses java.io.Serializable
uses java.math.BigDecimal

class RehabRiskMgmtRates_ACC implements Serializable {
  private var _runID : Long as RunID
  private var _levyApplicationYear : Integer as LevyApplicationYear
  private var _lrgCode : Integer as LRGCode
  private var _lrgDesc : String as LRGDesc
  private var _experienceYear : Integer as ExperienceYear
  private var _liableEarnings : BigDecimal as LiableEarnings
  private var _cappedWCD : Integer as CappedWCD
  private var _medicalSpendClaims : Integer as MedicalSpendClaims
  private var _expectedRehabMgmtRate : BigDecimal as ExpectedRehabMgmtRate
  private var _expectedRiskMgmtRate : BigDecimal as ExpectedRiskMgmtRate
}