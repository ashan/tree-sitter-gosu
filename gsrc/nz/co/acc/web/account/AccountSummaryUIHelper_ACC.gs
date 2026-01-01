package nz.co.acc.web.account

uses gw.api.locale.DisplayKey
uses gw.pl.currency.MonetaryAmount

class AccountSummaryUIHelper_ACC {

  static function getPolicyTermEmploymentStatus(policyPeriod : PolicyPeriod) : String {
    var fullTimeEmploymentStatus : Boolean = null
    if (policyPeriod.INDCPXLineExists) {
      fullTimeEmploymentStatus = policyPeriod.INDCPXLine.EmploymentStatus
    } else if (policyPeriod.INDCoPLineExists) {
      fullTimeEmploymentStatus = policyPeriod.INDCoPLine.CurrentFullTimeEmploymentStatus
    }
    if (fullTimeEmploymentStatus == null) {
      return DisplayKey.get("Web.AccountFile.Summary.PolicyTermsLV.NotApplicableLabel_ACC")
    } else if (fullTimeEmploymentStatus) {
      return DisplayKey.get("Web.AccountFile.Summary.PolicyTermsLV.EmploymentStatus_ACC.FullTime")
    } else {
      return DisplayKey.get("Web.AccountFile.Summary.PolicyTermsLV.EmploymentStatus_ACC.PartTime")
    }
  }

  static function getPolicyLine(policyPeriod : PolicyPeriod) : PolicyLine {
    var policyLine : PolicyLine = null
    if (policyPeriod.INDCPXLineExists) {
      policyLine = policyPeriod.INDCPXLine
    } else if (policyPeriod.INDCoPLineExists) {
      policyLine = policyPeriod.INDCoPLine
    } else if (policyPeriod.EMPWPCLineExists) {
      policyLine = policyPeriod.EMPWPCLine
    } else if (policyPeriod.CWPSLineExists) {
      policyLine = policyPeriod.CWPSLine
    } else if (policyPeriod.AEPLineExists) {
      policyLine = policyPeriod.AEPLine
    }
    return policyLine
  }

  static function hasMultipleClassificationUnit(policyPeriod : PolicyPeriod) : boolean {
    var policyLine = getPolicyLine(policyPeriod)
    var result = false
    if (policyLine typeis AEPLine and policyLine.AEPRateableCUData != null) {
      result = (policyLine as AEPLine).AEPRateableCUData.Count > 1
    } else if (policyLine.BICCodes != null) {
      result = policyLine.BICCodes.Count > 1
    }
    return result
  }

  static function getPolicyTermCUCode(policyPeriod : PolicyPeriod) : String {
    var bicCodes = policyPeriod.AEPLineExists ? getAEPBICCodes(policyPeriod) : getNonAEPBICCodes(policyPeriod)
    switch (bicCodes.size()) {
      case 0:
        return null
      case 1:
        var bicCode = bicCodes.first()
        if (bicCode typeis PolicyLineBusinessClassificationUnit_ACC) {
          return bicCode.CUCode
        } else if (bicCode typeis AEPRateableCUData_ACC) {
          return bicCode.CUCode
        } else {
          return null
        }
      default:
        return DisplayKey.get("Web.AccountFile.Summary.PolicyTermsLV.MultipleCULabel_ACC")
    }
  }

  static function getPolicyTermCUDescription(policyPeriod : PolicyPeriod) : String {
    var bicCodes = policyPeriod.AEPLineExists ? getAEPBICCodes(policyPeriod) : getNonAEPBICCodes(policyPeriod)
    switch (bicCodes.size()) {
      case 0:
        return null
      case 1:
        var bicCode = bicCodes.first()
        if (bicCode typeis PolicyLineBusinessClassificationUnit_ACC) {
          return bicCode.CUDescription
        } else if (bicCode typeis AEPRateableCUData_ACC) {
          return bicCode.CUDescription
        } else {
          return null
        }
      default:
        return DisplayKey.get("Web.AccountFile.Summary.PolicyTermsLV.MultipleCULabel_ACC")
    }
  }

  static function getAEPBICCodes(policyPeriod : PolicyPeriod) : List<AEPRateableCUData_ACC> {
    var bicCodes = new ArrayList<AEPRateableCUData_ACC>()
    if (policyPeriod.AEPLineExists) {
      bicCodes.addAll(policyPeriod.AEPLine.AEPRateableCUData.toList())
    }
    return bicCodes
  }

  static function getNonAEPBICCodes(policyPeriod : PolicyPeriod) : List<PolicyLineBusinessClassificationUnit_ACC> {
    var bicCodes = new ArrayList<PolicyLineBusinessClassificationUnit_ACC>()
    if (policyPeriod.INDCPXLineExists) {
      bicCodes.addAll(policyPeriod.INDCPXLine.BICCodes.toList())
    } else if (policyPeriod.INDCoPLineExists) {
      bicCodes.addAll(policyPeriod.INDCoPLine.BICCodes.toList())
    } else if (policyPeriod.EMPWPCLineExists) {
      bicCodes.addAll(policyPeriod.EMPWPCLine.BICCodes.toList())
    } else if (policyPeriod.CWPSLineExists) {
      bicCodes.addAll(policyPeriod.CWPSLine.BICCodes.toList())
    }
    return bicCodes
  }

  static function getPolicyTermAdjustedLiableEarning(policyPeriod : PolicyPeriod) : MonetaryAmount {
    var adjustedLiableEarnings : MonetaryAmount = null
    if (policyPeriod.INDCoPLineExists) {
      var coverable = policyPeriod.INDCoPLine.INDCoPCovs.first()
      if (coverable != null) {
        if (policyPeriod.IsNewLERuleAppliedYear or policyPeriod.CeasedTrading_ACC) {
          adjustedLiableEarnings = coverable.ActualLiableEarningsCov.AdjustedLiableEarnings
        } else if (not policyPeriod.CeasedTrading_ACC) {
          adjustedLiableEarnings = coverable.LiableEarningCov.AdjustedLiableEarnings
        }
      }
    } else if (policyPeriod.EMPWPCLineExists) {
      var coverable = policyPeriod.EMPWPCLine.EMPWPCCovs.first()
      if (coverable != null) {
        if (policyPeriod.Job.IsAudit_ACC) {
          adjustedLiableEarnings = coverable.LiableEarningCov.TotalLiableEarnings
        } else {
          adjustedLiableEarnings = coverable.LiableEarningCov.AdjustedLiableEarnings
        }
      }
    } else if (policyPeriod.CWPSLineExists) {
      var shareholdersEarnings = policyPeriod.CWPSLine.allShareholderEarnings()
      if (shareholdersEarnings != null and shareholdersEarnings.Count > 0) {
        if (policyPeriod.Job.IsAudit_ACC) {
          adjustedLiableEarnings = shareholdersEarnings
              .where(\earnings -> earnings.AuditAdjustedLELessCpx != null)
              .sum(Currency.TC_NZD, \elt -> elt.AuditAdjustedLELessCpx)
        } else {
          adjustedLiableEarnings = shareholdersEarnings
              .where(\earnings -> earnings.AdjustedLELessCpx != null)
              .sum(Currency.TC_NZD, \elt -> elt.AdjustedLELessCpx)
        }
      }
    } else if (policyPeriod.AEPLineExists) {
      var aepEarnings = policyPeriod.AEPLine.AdjustedLiableEarnings
      if (aepEarnings != null) {
        adjustedLiableEarnings = new MonetaryAmount(aepEarnings.getAmount(), aepEarnings.getCurrency())
      }
    }
    return adjustedLiableEarnings
  }

  /**
   * Used to find the most recent reference policy period to be used to display data on the policy term table in account summary
   * Each policyPeriodSummary available in that table is already the latet non-audit policy period hence
   * this function try to find completed final audit if applicable for the type of policy line
   *
   * @param policyPeriodSummary
   * @return the policy period to be used as information reference for the policy term
   */
  function findPolicyTermReferencePolicyPeriod(policyPeriodSummary : PolicyPeriodSummary) : PolicyPeriod {
    var policyPeriod = policyPeriodSummary.getPolicyPeriodSlice_ACC()
    var targetPeriod : PolicyPeriod
    if (not policyPeriod.INDCoPLineExists and not policyPeriod.INDCPXLineExists) {
      targetPeriod = policyPeriod.CompletedNotReversedFinalAudits.sortBy(\info -> info.CreateTime).last()?.Audit?.PolicyPeriod
    }
    if (targetPeriod == null) {
      targetPeriod = policyPeriod
    }
    return targetPeriod.Slice ? targetPeriod : targetPeriod.getSlice(targetPeriod.PeriodStart)
  }


  function getPolicyTermShareholderOnCPXIndicatorValue(policyPeriod : PolicyPeriod) : String {
    if (policyPeriod.CWPSLineExists) {
      return policyPeriod.CWPSLine.SHEOnCPXIndicator ? "Yes" : "No"
    } else {
      return DisplayKey.get("Web.AccountFile.Summary.PolicyTermsLV.NotApplicableLabel_ACC")
    }
  }


}