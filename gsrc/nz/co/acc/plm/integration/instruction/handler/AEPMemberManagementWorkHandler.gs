package nz.co.acc.plm.integration.instruction.handler

uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.instruction.AutoSkippedError
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.BundleHelper

/**
 * WorkHandler for AEPMemberManagement
 */
class AEPMemberManagementWorkHandler extends WorkHandlerBase {

  private var _productCode : String
  private var _actionName : String

  /**
   * Load the Parameters.
   *
   * The expected value is "[Product],[Action],[EffDate]"
   */
  override public function loadParameters() {
    var values : String[]
    var params = this.InstructionWorker.Parameters

    if (params != null) {
      values = params.split(InstructionConstantHelper.CSV_DELIMITER)
    }

    if (values == null || values.length != 3) {
      throw new DisplayableException("Parameters[${InstructionWorker.Parameters}] is not valid!")
    }
    _productCode = values[0]
    _actionName = values[1]
    if (!_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_EXIT)
           && !_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_ENTRY)) {
      throw new DisplayableException("Wrong action name[${_actionName}]!")
    }
    _effDate = InstructionConstantHelper.DATE_FORMAT_yMd.parse(values[2])
  }

  /**
   * Do policy change here
   * @param bundle
   */
  override public function doWork(bundle : Bundle) {

    var masterAccount = Account.finder.findAccountByAccountNumber(this.InstructionWorker.Instruction_ACC.AccountNumber)
    if (masterAccount == null) {
      throw new DisplayableException("Can't find master account!")
    }
    var memberAccount = ActionsUtil.getAccountByAccNumber(InstructionWorker.SequencerKey)
    if (memberAccount == null) {
      throw new DisplayableException("Can't find member account by[${InstructionWorker.SequencerKey}]!")
    }
    var sourceAcc : Account
    var targetAcc : Account

    if (_actionName.equalsIgnoreCase(InstructionConstantHelper.ACTION_ENTRY)) {
      sourceAcc = memberAccount
      targetAcc = masterAccount
    } else {
      sourceAcc = masterAccount
      targetAcc = memberAccount
    }

    var levyYear = InstructionWorker.Instruction_ACC.LevyYear
    var accNum = InstructionWorker.SequencerKey

    var target = findAEPPolicyPeriodTarget(accNum, levyYear, _productCode)
    var policy = target.Policy

    policy.cleanUpInternalJobs_ACC(bundle, getReasonCode())

    if (! target.isCanceled()) {
      if (policy.Account != sourceAcc) {
        throw new AutoSkippedError("Can't perform [${_actionName}] for [${InstructionWorker.SequencerKey}]!")
      }
      var editTarget = BundleHelper.explicitlyAddBeanToBundle(bundle, target, false)
      var jobs = editTarget.rewritePolicy_ACC(targetAcc, _effDate)
      jobs.each(\j -> setJobFlags(j))
    } else {
      throw new DisplayableException("The policy is already cancelled!")
    }
  }

}