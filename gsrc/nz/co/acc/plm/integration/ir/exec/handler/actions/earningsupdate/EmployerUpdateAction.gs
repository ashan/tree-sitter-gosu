package nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate

uses entity.PolicyLine
uses gw.pl.currency.MonetaryAmount
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses nz.co.acc.integration.ir.record.CARA6Record
uses nz.co.acc.plm.integration.ir.util.IRAccountHelper
uses productmodel.EMPWPCLine

/**
 * Created by Swati Patel on 13/04/2017.
 */
class EmployerUpdateAction extends EarningsUpdatePolicyActions {

  var _employerData : CARA6Record

  construct(record: CARA6Record) {
    super(record.PremiumYear, record.BalanceDate)
    this._employerData = record
  }

  protected override function createCoveragesForPolicyChange(lines: PolicyLine[]) {
    updateEmpCoveragesForPolicyChange(lines[0] as EMPWPCLine)
  }

  protected override function getPolicyLineType(): typekey.PolicyLine {
    return typekey.PolicyLine.TC_EMPWPCLINE
  }

  protected override function finalAuditRequired(): boolean {
    return true
  }

  protected override function policyChangeRequired(policyPeriod: PolicyPeriod): boolean {
    if (policyPeriod.Policy.isPDW(policyPeriod)) {
      return false
    }

    // Is it ceased - if so do not update
    if (policyPeriod.PolicyTerm.CeasedTrading_ACC) {
      return false
    }

    var provTargets = new IRAccountHelper(EarningsAccount).findPolicyTargets_ACC(_employerData.PremiumYear+1, recordType(), EarningsBundle)
    var provTarget: PolicyPeriod

    // TODO some of this code is copied in WPS.  Consider refactor.
    if (provTargets != null) {
      provTarget = provTargets.first()
    }

    if (provTarget == null) {
      return true
    }
    // If a FA already exists for the target year, we DO NOT create a provisional.
    if (provTarget.PolicyTerm.hasFinalAudit_ACC()) {
      return false
    }

    for (period in provTarget.PolicyTerm.findAllBoundPeriods_ACC()) {
      period = period.getSliceAtEffectiveDate_ACC()
      // If manual policy change, check if earnings changed
      if(!period.Job.InternalJob_ACC && period.Job.Subtype == typekey.Job.TC_POLICYCHANGE && period.Status == PolicyPeriodStatus.TC_BOUND) {
        var periodCoverage = period.EMPWPCLine.EMPWPCCovs[0].LiableEarningCov
        var basedOnPeriodCoverage = period.BasedOn.EMPWPCLine.EMPWPCCovs[0].LiableEarningCov

        if ((basedOnPeriodCoverage.TotalLiableEarnings != periodCoverage.TotalLiableEarnings) ||
            (basedOnPeriodCoverage.AdjustedLiableEarnings != periodCoverage.AdjustedLiableEarnings))
          return false
      }
    }
    return true
  }

  protected override function updateCoveragesForFinalAudit(info: AuditInformation) {
    var empCov = info.Audit.PolicyPeriod.EMPWPCLine.EMPWPCCovs.first()
    updateEmpCoverages(empCov)
  }

  protected override function getMaxYearsInPast(): int {
    return ScriptParameters.getParameterValue("IRWPCMaxYearsBack_ACC") as int
  }

  protected override function recordType(): IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CARA6
  }

  private function updateEmpCoveragesForPolicyChange(line: EMPWPCLine) {
    var empCov = line.EMPWPCCovs[0]
    updateEmpCoverages(empCov)
  }

  private function updateEmpCoverages(empCov: EMPWPCCov) {
    var cov = empCov.LiableEarningCov
    cov.TotalGrossEarnings = new MonetaryAmount(_employerData.GrossEarnings, defaultCurrency)
    cov.TotalEarningsNotLiable = new MonetaryAmount(_employerData.EarningsNotLiable, defaultCurrency)
    cov.TotalPAYE = new MonetaryAmount(_employerData.GrossWithholdingTax, defaultCurrency)
    cov.TotalExcessPaid = new MonetaryAmount(_employerData.MaximumEarnings, defaultCurrency)

    cov.TotalLiableEarnings = LiableEarningsUtilities_ACC.calculateTotalLiableEarningsEMPWPC(empCov).ofDefaultCurrency()
    cov.AdjustedLiableEarnings = LiableEarningsUtilities_ACC.calculateAdjustedLiableEarningsEMPWPC(empCov).ofDefaultCurrency()
    empCov.calculateBICLiableEarnings()
  }
}
