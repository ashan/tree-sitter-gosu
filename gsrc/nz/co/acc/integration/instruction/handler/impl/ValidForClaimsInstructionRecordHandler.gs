package nz.co.acc.integration.instruction.handler.impl

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandler
uses nz.co.acc.integration.instruction.handler.InstructionRecordHandlerUtil
uses nz.co.acc.integration.instruction.record.impl.ValidForClaimsInstructionRecord
uses nz.co.acc.validforclaims.ValidForClaimsUtil

class ValidForClaimsInstructionRecordHandler extends InstructionRecordHandler<ValidForClaimsInstructionRecord> {
  private static final var LOG = StructuredLogger.INTEGRATION.withClass(ValidForClaimsInstructionRecordHandler)

  construct(instructionRecord : ValidForClaimsInstructionRecord) {
    super(instructionRecord)
  }

  override function processInstructionRecord(bundle : Bundle) {
    var account = InstructionRecordHandlerUtil.findAccount(this.InstructionRecord.ACCID)
    LOG.info("Processing account ${account.ACCID_ACC} from this.InstructionRecord.ACCID=${this.InstructionRecord.ACCID}")
    var policyTerms = findPolicyTerms(account)
    LOG.info("Found ${policyTerms.Count} policyTerms for account ${account.ACCID_ACC}")
    for (policyTerm in policyTerms) {
      updatePolicyTerm(policyTerm, account)
    }
  }

  function findPolicyTerms(account : Account) : List<PolicyTerm> {
    return Query.make(PolicyTerm)
        .compare(PolicyTerm#VFCUpdatePending_ACC, Relop.Equals, true)
        .join(PolicyTerm#Policy)
        .compare(Policy#Account, Relop.Equals, account)
        .withDistinct(true)
        .select()
        .toList()
  }

  function updatePolicyTerm(policyTerm : PolicyTerm, account : Account) {
    var policyPeriod = policyTerm.findLatestBoundOrAuditedPeriod_ACC()
    if (policyPeriod == null) {
      LOG.info("Processing PolicyTerm ${policyTerm.PublicID} on Account ${account.ACCID_ACC} : PolicyPeriod is null")
      return
    }
    var newVFCFlag = ValidForClaimsUtil.isPolicyTermVFC(policyPeriod)
    LOG.info("Processing PolicyTerm ${policyTerm.PublicID} on Account ${account.ACCID_ACC} : ValidForClaimsReg_ACC=${newVFCFlag}")

    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        policyTerm = bundle.add(policyTerm)
        policyTerm.ValidForClaimsReg_ACC = newVFCFlag
        policyTerm.VFCOverrideDate_ACC = null
        policyTerm.VFCUpdatePending_ACC = false
      })
    } catch (e : Exception) {
      LOG.error_ACC("Failed to update PolicyTerm ${policyTerm.PublicID} on Account ${policyTerm.Policy.Account.ACCID_ACC}", e)
      throw e
    }
  }
}