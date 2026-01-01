package gw.web.job.submission

uses gw.api.util.JurisdictionMappingUtil
uses gw.api.web.job.submission.SubmissionUtil
uses gw.api.locale.DisplayKey
uses nz.co.acc.edge.capabilities.policy.util.PolicyUtil_ACC
uses nz.co.acc.lob.common.DateUtil_ACC
uses pcf.JobForward

@Export
class NewSubmissionUtil {

  /**
   * Returns the a valid {@link ProducerSelection}, either from the session or from the account.
   * @return a {@link ProducerSelection} in the web session
   */
  static function getOrCreateProducerSelection (account : Account) : ProducerSelection {
    return SubmissionUtil.getOrCreateProducerSelection(account, \ a -> JurisdictionMappingUtil.getJurisdiction(a))
  }

  static function createOneSubmission(offer : ProductSelection, producerSelection : ProducerSelection, account : Account,
      quoteType : QuoteType) {

    // DE102 - Set the Producer Selection state to NZ as the producer is ACC.
    producerSelection.State = Jurisdiction.TC_NZ

    if(!account.AEPContractAccount_ACC and !account.AccountHolderContact.isProductAddressFieldSet(offer.ProductCode)) {
      var policyType = PolicyUtil_ACC.getProductPolicyType(offer.ProductCode)
      throw new gw.api.util.DisplayableException( DisplayKey.get('Web.SubmissionManagerLV.AddressFieldNotSet', policyType.DisplayName, policyType.DisplayName) )
    }

    if( producerSelection.DefaultPPEffDate == null ) {
      throw new gw.api.util.DisplayableException(DisplayKey.get('Web.SubmissionManagerLV.DefaultPPEffDateRequired'))
    }
    // US3396 - Set the effective date to the start of the current levy year
    producerSelection.DefaultPPEffDate = DateUtil_ACC.previousACCLevyYearStart(Date.Today)

    var availOffer = account.getAvailableProduct( producerSelection.SubmissionPolicyProductRoot, offer.Product )
    if( availOffer == null )
    {
      throw new gw.api.util.DisplayableException( DisplayKey.get('Web.SubmissionManagerLV.UnavailableProduct',  offer.Product ) )
    }
    if( producerSelection.ProducerCode == null )
    {
      throw new gw.api.util.DisplayableException( DisplayKey.get('Web.SubmissionManagerLV.ProducerCodeRequired') )
    }
    gw.api.web.job.submission.SubmissionUtil.setLastProducerSelection( producerSelection )
    offer.NumToCreate = 1
    // DE446 - validate account has a valid State
    account.validatePrimaryAddressState_ACC()
    var submission = gw.api.web.job.submission.SubmissionUtil.createSubmission( offer, account, producerSelection, quoteType )
    // For one new submission - go straight to Submission view
    var policyPeriod = submission.LatestPeriod
    // DE2362 - take set number of years off period start and period end
    if (!policyPeriod.AEPLineExists) { // DE2594 exclude AEP master policies
      var offset = ScriptParameters.IRPeriodStartOffset_ACC
      var periodStartLessYear = policyPeriod.PeriodStart.addYears(offset)
      var periodEndLessYear = policyPeriod.PeriodEnd.addYears(offset)
      policyPeriod.setPeriodWindow(periodStartLessYear, periodEndLessYear)
    }
    gw.transaction.Transaction.runWithNewBundle( \ bun -> {
      policyPeriod = bun.add( policyPeriod )
      // Added below line to make CPX optional
      if (policyPeriod.INDCPXLineExists) {
        var cpxLinePattern = policyPeriod.Policy.Product.LinePatterns.firstWhere(\p -> p.isAvailable(policyPeriod) && p.PolicyLineSubtype == TC_INDCPXLINE)
        policyPeriod.removeFromLines(policyPeriod.getLine(cpxLinePattern))
        policyPeriod.updateTerritoryCodes()
      }
      // DE472 - Set the Active Term to false for new submissions
      policyPeriod.PolicyTerm.ActiveTerm_ACC = false
      if (policyPeriod.IsAEPMasterPolicy_ACC) {
        policyPeriod.PolicyTerm.AEPPhase_ACC = AEPPhase_ACC.TC_CONTRACT_DATA
      }

      // US3700 - Create the policy suffix
      policyPeriod.createACCPolicyID()

      policyPeriod.SubmissionProcess.beginEditing()
    } )
    JobForward.go(submission, policyPeriod)
  }

  static function makeNumberRange( max : int ) : java.util.List<java.lang.Integer> {
    var result = new java.util.ArrayList<java.lang.Integer>()
    var count = 0
    while( count <= max ) {
      result.add( count )
      count = count + 1
    }
    return result
  }
}

