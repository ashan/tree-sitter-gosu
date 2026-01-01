package nz.co.acc.plm.integration.instruction.handler

uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.lob.util.LiableEarningsUtilities_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses entity.PolicyLine
uses entity.BusinessIndustryCode_ACC
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * WorkHandler for BulkEarningsChange
 */
class BulkCPEarningsChangeWorkHandler extends WorkHandlerBase {

  private var _levyYear : Integer
  private var _netSchedulerPayments : MonetaryAmount
  private var _totalActivePartnershipIncome : MonetaryAmount
  private var _adjLTCIncome : MonetaryAmount
  private var _selfEmployedNetIncome : MonetaryAmount
  private var _totalExpensesClaimed : MonetaryAmount
  private var _invEarningsNotLiable : MonetaryAmount
  private var _earningsAsEmployeeTotalGrossIncome : MonetaryAmount
  private var _totalSHEEmployeeSalary : MonetaryAmount
  private var _totalEmpIncomeNotLiableEarnersLevy : MonetaryAmount
  private var _totalOtherNetIncome : MonetaryAmount
  private var _totalOverseasIncome : MonetaryAmount
  private var _previousYearsLE : Boolean
  private var _ceasedYearsActualLE : Boolean

  /**
   * Load the Parameters.
   *
   * The expected value is "[LevyYear]"
   */
  override public function loadParameters() {
    var values : String[]
    var params = this.InstructionWorker.Parameters

    InstructionWorker.RuntimeMessage = new String()

    if (params != null) {
      values = params.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length < 1) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }
    _levyYear = Integer.valueOf(values[0])

    if(values.length>1) {
      _netSchedulerPayments = getMonetaryAmount(values[1])
      _totalActivePartnershipIncome = getMonetaryAmount(values[2])
      _adjLTCIncome = getMonetaryAmount(values[3])
      _selfEmployedNetIncome = getMonetaryAmount(values[4])
      _totalExpensesClaimed = getMonetaryAmount(values[5])
      _invEarningsNotLiable = getMonetaryAmount(values[6])
      _earningsAsEmployeeTotalGrossIncome = getMonetaryAmount(values[7])
      _totalSHEEmployeeSalary = getMonetaryAmount(values[8])
      _totalEmpIncomeNotLiableEarnersLevy = getMonetaryAmount(values[9])
      _totalOtherNetIncome = getMonetaryAmount(values[10])
      _totalOverseasIncome = getMonetaryAmount(values[11])
      _previousYearsLE = processLEFlag(values[12], "Previous years")
      _ceasedYearsActualLE = processLEFlag(values[13], "Ceased years")
    } else {
      InstructionWorker.RuntimeMessage = "Parameter values are empty, no change applied"
    }

    if(!_previousYearsLE and !_ceasedYearsActualLE) {
      throw new DisplayableException("Previous and Ceased years flags are false, no change applied")
    }
  }

  private function processLEFlag(value : String, fieldName:String) : boolean {
    if(checkBooleanString(value)) {
      try {
        return Boolean.valueOf(value)
      } catch (ex : NullPointerException) {
        return false
      } catch (ex : ArrayIndexOutOfBoundsException) {
        return false
      }
    } else {
      throw new DisplayableException("Invalid " + fieldName + " LE flag. Please use true or false")
    }
  }

  private function checkBooleanString(value:String) : boolean {
    return value.equalsIgnoreCase("true") or value.equalsIgnoreCase("false")
  }

  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {
    var key = InstructionWorker.SequencerKey
    if(InstructionWorker.RuntimeMessage == null) {
      InstructionWorker.RuntimeMessage = ""
    }

    var targets = findPolicyPeriodTargets(key, ConstantPropertyHelper.PRODUCTCODE_CP, _levyYear)
                  .where(\elt -> elt.Audit == null)

    if (targets == null || targets.length == 0) {
      throw new DisplayableException("Can not find any targets to update!")
    }

    targets.each(\policyPeriod -> {
      var policy = policyPeriod.Policy
      policy.cleanUpInternalJobs_ACC(bundle, getReasonCode(), _levyYear)

      if(_previousYearsLE && hasSameEarnings(policyPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov)) {
        InstructionWorker.RuntimeMessage = "Previous Years Earnings fields has no change."
        _previousYearsLE = false
      }

      if(_ceasedYearsActualLE && hasSameEarnings(policyPeriod.INDCoPLine.INDCoPCovs.first().ActualLiableEarningsCov)) {
        InstructionWorker.RuntimeMessage = "Ceased Years Earnings fields has no change."
        _ceasedYearsActualLE = false
      }

      if(_previousYearsLE or _ceasedYearsActualLE) {
        InstructionWorker.RuntimeMessage = ""
        changeEarningsByPolicyChange(policyPeriod, bundle)
      }
    })
  }

  /**
   * Change Earnings to the new values by PolicyChange
   * @param lastPeriod
   * @param bundle
   */
  private function changeEarningsByPolicyChange(lastPeriod : PolicyPeriod, bundle : Bundle) {
    var policyChange = new PolicyChange(bundle)

    setJobFlags(policyChange)
    policyChange.startJob(lastPeriod.Policy, lastPeriod.PeriodStart)

    var newPeriod = policyChange.LatestPeriod
    var theProcess = newPeriod.PolicyChangeProcess

    if(_previousYearsLE) {
      copyEarnings(newPeriod.INDCoPLine.INDCoPCovs.first().LiableEarningCov)
    }

    if(_ceasedYearsActualLE) {
      copyEarnings(newPeriod.INDCoPLine.INDCoPCovs.first().ActualLiableEarningsCov)
    }

    completePolicyChange(theProcess, newPeriod)
  }

  private function copyEarnings(destEarnings : INDLiableEarnings_ACC) {
    if(_netSchedulerPayments != null) {
      destEarnings.NetSchedulerPayments = _netSchedulerPayments
    }

    if(_totalActivePartnershipIncome != null) {
      destEarnings.TotalActivePartnershipInc = _totalActivePartnershipIncome
    }

    if(_adjLTCIncome != null) {
      destEarnings.AdjustedLTCIncome = _adjLTCIncome
    }

    if(_selfEmployedNetIncome != null) {
      destEarnings.SelfEmployedNetIncome = _selfEmployedNetIncome
    }

    if(_totalExpensesClaimed != null) {
      destEarnings.TotalOtherExpensesClaimed = _totalExpensesClaimed
    }

    if(_invEarningsNotLiable != null) {
      destEarnings.EarningNotLiable = _invEarningsNotLiable
    }

    if(_earningsAsEmployeeTotalGrossIncome != null) {
      destEarnings.TotalGrossIncome = _earningsAsEmployeeTotalGrossIncome
    }

    if(_totalSHEEmployeeSalary != null) {
      destEarnings.TotalShareholderEmplSalary = _totalSHEEmployeeSalary
    }

    if(_totalEmpIncomeNotLiableEarnersLevy != null) {
      destEarnings.TotalIncomeNotLiable = _totalEmpIncomeNotLiableEarnersLevy
    }

    if(_totalOtherNetIncome != null) {
      destEarnings.TotalOtherNetIncome = _totalOtherNetIncome
    }

    if(_totalOverseasIncome != null) {
      destEarnings.TotalOverseasIncome = _totalOverseasIncome
    }
  }

  private function hasSameEarnings(destEarnings : INDLiableEarnings_ACC) : boolean {
    if(_netSchedulerPayments != null and
       destEarnings.NetSchedulerPayments != _netSchedulerPayments) {
      return false
    }

    if(_totalActivePartnershipIncome != null and
       destEarnings.TotalActivePartnershipInc != _totalActivePartnershipIncome) {
      return false
    }

    if(_adjLTCIncome != null and
       destEarnings.AdjustedLTCIncome != _adjLTCIncome) {
      return false
    }

    if(_selfEmployedNetIncome != null and
        destEarnings.SelfEmployedNetIncome != _selfEmployedNetIncome) {
      return false
    }

    if(_totalExpensesClaimed != null and
       destEarnings.TotalOtherExpensesClaimed != _totalExpensesClaimed) {
      return false
    }

    if(_invEarningsNotLiable != null and
       destEarnings.EarningNotLiable != _invEarningsNotLiable) {
      return false
    }

    if(_earningsAsEmployeeTotalGrossIncome != null and
       destEarnings.TotalGrossIncome != _earningsAsEmployeeTotalGrossIncome) {
      return false
    }

    if(_totalSHEEmployeeSalary != null and
       destEarnings.TotalShareholderEmplSalary != _totalSHEEmployeeSalary) {
      return false
    }

    if(_totalEmpIncomeNotLiableEarnersLevy != null and
       destEarnings.TotalIncomeNotLiable != _totalEmpIncomeNotLiableEarnersLevy) {
      return false
    }

    if(_totalOtherNetIncome != null and
       destEarnings.TotalOtherNetIncome != _totalOtherNetIncome) {
      return false
    }

    if(_totalOverseasIncome != null and
       destEarnings.TotalOverseasIncome != _totalOverseasIncome) {
      return false
    }

    return true
  }
}
