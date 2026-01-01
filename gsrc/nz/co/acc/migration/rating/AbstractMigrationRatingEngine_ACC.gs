package nz.co.acc.migration.rating

uses entity.PolicyLine
uses gw.rating.AbstractRatingEngine
uses gw.rating.CostData
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.lob.common.rating.AbstractRatingEngine_ACC
uses nz.co.acc.rating.util.ZeroRatingUtil_ACC

/**
 * Rating engine functionality for data migration
 */
abstract class AbstractMigrationRatingEngine_ACC<PL extends PolicyLine> extends AbstractRatingEngine_ACC<PL> {
  private static var _LOG = StructuredLogger.CONFIG.withClass(AbstractRatingEngine)
  private static final var _LOG_TAG = "${AbstractMigrationRatingEngine_ACC.Type.RelativeName} - "
  
  construct(line: PL) {
    super(line, RateBookStatus.TC_ACTIVE)
  }

  construct(line : PL, minimumRatingLevel: RateBookStatus) { super(line, minimumRatingLevel) }

  override function rateOnly(): Map <PolicyLine, List <CostData>> {
    if (_LOG.InfoEnabled) {
      _LOG.info(_LOG_TAG + "rateOnly process ${typeof(PolicyLine.Branch.Job)}")
    }
    var results = CostDataMap
    var disableRating = PolicyLine.Branch.Migrating_ACC and PolicyLine.Branch.Job.MigrationJobInfo_ACC.DisableRating
    var job = PolicyLine.AssociatedPolicyPeriod.Job
    if (PolicyLine.Branch.IsAEPMemberPolicy_ACC or
        (job typeis Cancellation and job.CancelReasonCode == TC_REMOVEDFROMAEPGROUP_ACC and job.EarningsAdjustment_ACC) or
        (job typeis Cancellation and job.CancelReasonCode == TC_JOINEDAEPGROUP_ACC and job.EarningsAdjustment_ACC) or
        (job typeis RewriteNewAccount and PolicyLine.AssociatedPolicyPeriod.CeasedTrading_ACC) or
        (PolicyLine.AssociatedPolicyPeriod.IsAEPMemberPolicy_ACC == false and PolicyLine.AssociatedPolicyPeriod.NewAEPCustomer_ACC) or
        (PolicyLine.AssociatedPolicyPeriod.Policy.RewrittenToNewAccountSource != null and
         PolicyLine.AssociatedPolicyPeriod.IsAEPMemberPolicy_ACC == false and
         PolicyLine.AssociatedPolicyPeriod.CeasedTrading_ACC)
    ) {
      // Zero rated
    } else if (disableRating) {
      results.get(PolicyLine).clear()
      updateDataMigrationCosts(PolicyLine)
    } else {
      // not migrated or not disabling rating
      // DE447 - Remove all the LE and Adjusted LE amounts for Prevent Reassessment Accounts
      if (PolicyLine.AssociatedPolicyPeriod.Policy.Account.PreventReassessment_ACC) {
        ZeroRatingUtil_ACC.zeroRateQuoteIfPreventReass(PolicyLine.Branch)
      }

      results = super.rateOnly()
    }
    if (_LOG.DebugEnabled) _LOG.debug(_LOG_TAG + "rateOnly exit")
    return results
  }

  abstract protected function updateDataMigrationCosts(lineVersion: PL)

}
