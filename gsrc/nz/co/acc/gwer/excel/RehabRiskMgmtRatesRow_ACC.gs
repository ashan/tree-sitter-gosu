package nz.co.acc.gwer.excel

uses nz.co.acc.gwer.databeans.RehabRiskMgmtRates_ACC
uses nz.co.acc.lob.common.excel.ExcelRow

/**
 * Created by manubaf on 13/02/2020.
 */
class RehabRiskMgmtRatesRow_ACC implements ExcelRow {
  var _rehabRiskRate : RehabRiskMgmtRates_ACC as RehabRiskMgmtRate
  construct(rehabRiskRate : RehabRiskMgmtRates_ACC) {
    _rehabRiskRate = rehabRiskRate
  }

  override function rowEmpty() : boolean {
    return _rehabRiskRate.RunID != null and 
           _rehabRiskRate.LevyApplicationYear != null and 
           _rehabRiskRate.LRGCode != null and
           _rehabRiskRate.LRGDesc != null and
           _rehabRiskRate.ExperienceYear != null and
           _rehabRiskRate.LiableEarnings != null and
           _rehabRiskRate.CappedWCD != null and
           _rehabRiskRate.MedicalSpendClaims != null and
           _rehabRiskRate.ExpectedRehabMgmtRate != null and
           _rehabRiskRate.ExpectedRiskMgmtRate != null
  }

  override function anyDataMissing() : boolean {
    return _rehabRiskRate.RunID != null or
        _rehabRiskRate.LevyApplicationYear != null or
        _rehabRiskRate.LRGCode != null or
        _rehabRiskRate.LRGDesc != null or
        _rehabRiskRate.ExperienceYear != null or
        _rehabRiskRate.LiableEarnings != null or
        _rehabRiskRate.CappedWCD != null or
        _rehabRiskRate.MedicalSpendClaims != null or
        _rehabRiskRate.ExpectedRehabMgmtRate != null or
        _rehabRiskRate.ExpectedRiskMgmtRate != null
  }
}