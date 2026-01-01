package nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate

uses entity.PolicyLine
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount

uses nz.co.acc.integration.ir.record.CARA4Record
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses nz.co.acc.plm.integration.ir.util.IRAccountHelper

uses gw.surepath.suite.integration.logging.StructuredLogger
uses productmodel.INDCoPLine

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Self Employed policy specific behaviour.
 * <p>
 * Created by Swati Patel on 13/04/2017.
 */
class SelfEmployedUpdateAction extends EarningsUpdatePolicyActions {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _isCeased : boolean
  var _selfEmployedData : CARA4Record

  construct(record : CARA4Record) {
    super(record.PremiumYear, record.BalanceDate)
    this._selfEmployedData = record
  }

  protected override function checkMultipleTargetsAllowed() : boolean {
    return false
  }

  protected override function getMaxYearsInPast() : int {
    return ScriptParameters.getParameterValue("IRCPMaxYearsBack_ACC") as int
  }

  protected override function recordType() : IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CARA4
  }

  protected override function createCoveragesForPolicyChange(lines : PolicyLine[]) {
    var cpLine = lines.firstWhere(\elt -> elt typeis productmodel.INDCoPLine)
    updateIndCoverages(cpLine as productmodel.INDCoPLine)
  }

  protected override function getPolicyLineType() : typekey.PolicyLine {
    return typekey.PolicyLine.TC_INDCOPLINE
  }

  protected override function policyChangePreProcess(policyPeriod : PolicyPeriod) : PolicyPeriod {
    var periods : List<PolicyPeriod>
    // ChrisA 22/05/2020 JUNO-3966 uncease the policy if there are earnings in subsequent years
    if (isCeased(policyPeriod)) {
      UnCeasePolicyPeriodIfEarningsInSubsequentYears(policyPeriod)
    }

    // If the policy is not ceased, we actually apply the earnings to levy year + 1.  Seems odd, I don't understand why.
    if (!policyPeriod.IsNewLERuleAppliedYear and !isCeased(policyPeriod)) {
      _log.debug("Job type: ${policyPeriod.Job.Subtype}")
      _log.debug("Self employed policy is not ceased, retrieving policy period for: ${_selfEmployedData.PremiumYear + 1}")
      periods = new IRAccountHelper(EarningsAccount).findPolicyTargets_ACC(_selfEmployedData.PremiumYear + 1, IRExtRecordType_ACC.TC_CARA4, EarningsBundle)

      if (periods.Count > 1) {
        throw new RuntimeException("Got more than one target for Self Employed policy for levy year: ${_selfEmployedData.PremiumYear + 1}. ACC number: ${EarningsAccount.ACCID_ACC}")
      } else if (periods.Count == 0) {
        _log.debug("Renewing to get self employed non ceased target.")
        // we need a renewal
        var renewal = doPolicyRenew(policyPeriod)
        return renewal.LatestPeriod
      } else {
        _log.debug("Returning existing policy period for self employed non ceased target.")
        // we give back the target that we got.
        policyPeriod = periods[0]
        policyPeriod = EarningsBundle.add(policyPeriod)
      }
    }

    return policyPeriod
  }

  protected override function policyChangePostProcess(policyPeriod : PolicyPeriod) {
    if (_isCeased) {
      _log.debug("Policy ceased, no further processing required.")
      // Nothing needs to be done.
      return
    }

    _log.debug("Updating terms to active for policy periods for: ${_selfEmployedData.PremiumYear} and ${_selfEmployedData.PremiumYear + 1}")

    // We need to set both levy year & levy year + 1 to active.  I don't understand why.
    var cpLine = policyPeriod.Lines.firstWhere(\elt -> elt typeis productmodel.INDCoPLine)
    var line = cpLine as INDCoPLine
    var policyTerm = EarningsBundle.add(line.AssociatedPolicyPeriod.PolicyTerm)
    policyTerm.ActiveTerm_ACC = true

    // The policy period is the one for levy year + 1, so we now need to find the previous one.
    var targets = new IRAccountHelper(EarningsAccount).findPolicyTargets_ACC(policyPeriod.LevyYear_ACC - 1, IRExtRecordType_ACC.TC_CARA4, EarningsBundle)

    if (targets.Count == 0 || targets.Count != 1) {
      throw new RuntimeException("Invalid number of targets for self employed policy when searching for previous levy year.  Got: ${targets.Count} targets")
    }

    var period = targets[0]
    period = EarningsBundle.add(period)
  }

  private function updateIndCoverages(line : INDCoPLine) {
    var indCov = line.INDCoPCovs[0]
    var cov : INDLiableEarnings_ACC
    // Depending on if the policy is ceased, we update different coverages - note that we use the isCeased value from the preProcess.  We do not check again.
    if (_isCeased or (line.AssociatedPolicyPeriod.IsNewLERuleAppliedYear and IsPremiumYearNewLERuleAppliedYear)) {
      cov = indCov.ActualLiableEarningsCov
    } else {
      cov = indCov.LiableEarningCov
    }

    cov.TotalGrossIncome = new MonetaryAmount(_selfEmployedData.GrossEmployeeEarnings, defaultCurrency)
    cov.TotalOtherExpensesClaimed = new MonetaryAmount(_selfEmployedData.Expenses, defaultCurrency)
    cov.TotalShareholderEmplSalary = new MonetaryAmount(_selfEmployedData.ShareholderEmployeeSalaryNotLiable, defaultCurrency)
    cov.AdjustedLTCIncome = new MonetaryAmount(_selfEmployedData.LTCIncome, defaultCurrency)

    cov.SelfEmployedNetIncome = new MonetaryAmount(_selfEmployedData.EarningsToPAYE, defaultCurrency)
    cov.TotalOtherNetIncome = new MonetaryAmount(_selfEmployedData.OtherIncome, defaultCurrency)
    cov.TotalOverseasIncome = new MonetaryAmount(_selfEmployedData.OverseasIncome, defaultCurrency)
    cov.TotalActivePartnershipInc = new MonetaryAmount(_selfEmployedData.PartnershipIncome, defaultCurrency)

    cov.NetSchedulerPayments = new MonetaryAmount(_selfEmployedData.TotalGrossPayments, defaultCurrency)
    cov.TotalIncomeNotLiable = new MonetaryAmount(_selfEmployedData.TotalIncomeNotLiableForEP, defaultCurrency)

    cov.TotalLiableEarnings = LiableEarningsUtilities_ACC.calculateTotalLiableEarningsINDCoP(cov).ofDefaultCurrency()
    if (cov.IndividualLiableEarningsFieldsIsZero and cov.TotalLiableEarnings.IsZero) {
      cov.setAdjustedLiableEarningsToZero()
    } else {
      cov.AdjustedLiableEarnings = LiableEarningsUtilities_ACC.calculateAdjustedLiableEarningsINDCoP(cov).First.ofDefaultCurrency()
    }

    if (cov.Branch.PolicyTerm.ActiveTerm_ACC == false) {
      var zero = new BigDecimal(0.00).setScale(2, RoundingMode.HALF_UP)
      var minLiableEarnings = (ScriptParameters.getParameterValue("IRFMUMinLiableEarnings_ACC") as BigDecimal)
      var previousYearsCov = cov.previousYearsLiableEarnings()
      var combinedEarnings = cov.combinedEarnings()
      if (cov.TotalLiableEarnings.Amount >= minLiableEarnings) {
        cov.FullTime = true
      } else if (previousYearsCov != null and previousYearsCov.TotalLiableEarnings_amt != zero) {
        cov.FullTime = previousYearsCov.FullTime
      } else if (cov.earningsPotentiallyPartTime() // The earnings are potentially part-time
          and cov.TotalShareholderEmplSalary_amt == zero // No shareholder employee earnings
          and (combinedEarnings < (minLiableEarnings.multiply(0.75bd)) // Combined earnings < 75% on full-time minimum
          and combinedEarnings > zero)) { // Combined earnings > 0
        cov.FullTime = false
      } else if (cov.LiableEarningsFieldsIsZero) {
        cov.FullTime = false
      }
    }

    indCov.calculateBICLiableEarnings(true)
  }

  property get IsPremiumYearNewLERuleAppliedYear() : boolean {
    return _selfEmployedData.PremiumYear >= (ScriptParameters.getParameterValue("SelfEmployedNewLEStartYear") as Integer)
  }

  private function isCeased(policyPeriod : PolicyPeriod) : boolean {
    _isCeased = policyPeriod.PolicyTerm.CeasedTrading_ACC
    return _isCeased
  }

  // ChrisA 22/05/2020 JUNO-3966 uncease policy period when processing CARA4 if there are earnings in subsequent years
  // this avoids the error thrown in checkForLEofFollowingYear() above
  private function UnCeasePolicyPeriodIfEarningsInSubsequentYears(policyPeriodToUnCease : PolicyPeriod) {
    // For ceased CP policies only
    if (!policyPeriodToUnCease.PolicyTerm.CeasedTrading_ACC) {
      return
    }

    var currentLevyYear = policyPeriodToUnCease.LevyYear_ACC
    // Determine the appropriate yeat to check earnings on using Logic:
    // If < 2019 look 2 year ahead - liable
    // If >= 2019 look 1 year - actual - This is the transition year
    var levyYearToCheck = currentLevyYear + 2
    if (policyPeriodToUnCease.IsUnceaseRule1) {
      levyYearToCheck = currentLevyYear + 1
    }
    var policyPeriods = policyPeriodToUnCease.Policy.CompletedPeriodsWithCost.where(\pp -> pp.LevyYear_ACC == levyYearToCheck)
    var totalLiableEarnings = BigDecimal.ZERO
    for (policyPeriod in policyPeriods) {
      if (policyPeriodToUnCease.IsUnceaseRule1) {
        // Get actuals
        totalLiableEarnings = policyPeriod?.INDCoPLine?.INDCoPCovs?.first()?.ActualLiableEarningsCov?.TotalLiableEarnings
      } else {
        totalLiableEarnings = policyPeriod?.INDCoPLine?.INDCoPCovs?.first()?.LiableEarningCov?.TotalLiableEarnings
      }
      if (totalLiableEarnings != null and totalLiableEarnings != 0) {
        _log.info("Unceasing policy period ${policyPeriodToUnCease.ACCPolicyID_ACC} ${policyPeriodToUnCease.PublicID}, for ${policyPeriodToUnCease.LevyYear_ACC} with earnings of ${totalLiableEarnings}")
        policyPeriodToUnCease.unceasePolicyOnLevyYear_ACC(currentLevyYear)
        break
      }
    }
  }

}
