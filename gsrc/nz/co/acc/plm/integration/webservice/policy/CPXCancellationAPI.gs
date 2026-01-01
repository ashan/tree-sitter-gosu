package nz.co.acc.plm.integration.webservice.policy

uses gw.api.archive.PolicyTermInArchiveSOAPException
uses gw.api.locale.DisplayKey
uses gw.api.webservice.exception.AlreadyExecutedException
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.EntityStateException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.api.webservice.exception.SOAPException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses gw.webservice.SOAPUtil
uses gw.xml.ws.annotation.WsiPermissions
uses gw.xml.ws.annotation.WsiWebService

/**
 * The web service was created to handle delinqency calls from Billing application.
 * BillingCenter cpx delinquency workflow was modified to achieve this.
 * Upon receiving cpx cancellation BC, this service will issue the right job as documented in US3006.
 * <p>
 * Created by Farooq Ali on 23/05/2017.
 */
@WsiWebService("http://guidewire.com/pc/ws/nz/co/acc/plm/integration/webservice/policy/CPXCancellationAPI")
@Export
class CPXCancellationAPI {
  final var LOG = StructuredLogger_ACC.INTEGRATION.withClass(this)

  /**
   * Pro-rated CPX cancellation. Called/triggered by BC delinquency.
   * Copied and modified from CancellationAPI.beginCancellation
   *
   * @Param policyNumber The number of the period that should be canceled.
   * @Param cancellationDate The effective date for the cancellation. Cannot be null.
   * @Param cancellationSource Who initiates the cancellation (e.g., the carrier or the insured).
   * @Param reasonCode Typekey indicating the reason for the cancellation.
   * @Param transactionId The unique id for this request. If this is duplicated with that of
   * any other previous requests, AlreadyExecutedException will be thrown
   * @Returns The unique job number for the started Cancellation job.
   */
  @Throws(SOAPException, "If communication errors occur")
  @Throws(RequiredFieldException, "If required field is missing")
  @Throws(BadIdentifierException, "If cannot find entity with given identifier")
  @Throws(AlreadyExecutedException, "If the transactionId is duplicated with that of any other"
      + " previous requests")
  @Throws(EntityStateException, "If no policy period with number <code>policyNumber</code>"
      + " effective on date <code>cancellationDate</code> can be found, if that policy period"
      + " cannot be canceled for any reason (e.g., the policy is not in force or the cancellation"
      + " would be an unsupported out-of-sequence change), or if any other error occurs"
      + " processing the SOAP request.")
  @Throws(PolicyTermInArchiveSOAPException, "If the policy term specified is in the archive, it may not"
      + " be cancelled. If necessary, restore the policy term from the archive in order to continue.")
  @Param("policyNumber", "The number of the period that should be canceled.")
  @Param("cancellationDate", "The effective date for the cancellation. Cannot be null.")
  @Param("cancellationSource", "Who initiates the cancellation (e.g., the carrier or the insured).")
  @Param("reasonCode", "Typekey indicating the reason for the cancellation.")
  @Param("transactionId", "The unique id for this request. If this is duplicated with that of any other previous requests, AlreadyExecutedException will be thrown")
  @WsiPermissions({SystemPermissionType.TC_CREATECANCELLATION})
  @Returns("The unique job number for the started Cancellation job.")
  public function cancelCPX(
      policyNumber : String,
      cancellationDate : Date,
      cancellationSource : CancellationSource,
      reasonCode : typekey.ReasonCode,
      transactionId : String) : String {

    LOG.info("cancelCPX: policyNumber=${policyNumber}, cancellationDate=${cancellationDate.toISOTimestamp()}, "
        + "cancellationSource=${cancellationSource}, reasonCode=${reasonCode}, transactionId=${transactionId}")

    return SOAPUtil.tryCatch(\bundle -> {
      SOAPUtil.require(policyNumber, "policyNumber")
      SOAPUtil.require(cancellationDate, "cancellationDate")
      SOAPUtil.require(cancellationSource, "cancellationSource")
      SOAPUtil.require(reasonCode, "reasonCode")
      return processCancelCPX(bundle, policyNumber, cancellationDate, cancellationSource, reasonCode)
    }, transactionId)
  }

  private function processCancelCPX(
      bundle : Bundle,
      policyNumber : String,
      cancellationDate : Date,
      cancellationSource : CancellationSource,
      reasonCode : typekey.ReasonCode) : String {

    // Ensure the reasonCode matches the cancellationSource
    if (!reasonCode.Categories.contains(cancellationSource)) {
      var error = DisplayKey.get("CancellationAPI.Error.ReasonCodeMismatch", cancellationSource, reasonCode)
      throw new EntityStateException(DisplayKey.get("CancellationAPI.Error.CannotCancel", policyNumber, error))
    }

    var period = retrievePolicyPeriod(policyNumber, cancellationDate, bundle)
    if (period.Archived) throw new PolicyTermInArchiveSOAPException(period.PolicyTerm)

    if (not period.INDCPXLineExists) {
      var error = "Policy does not have CPX at cancellation date ${cancellationDate.toISODate()}"
      throw new EntityStateException(DisplayKey.get("CancellationAPI.Error.CannotCancel", policyNumber, error))
    }

    try {
      if (period.LevyYear_ACC < 2025 or getCPXStartDate(period) >= cancellationDate) {
        return cancelAndRemoveCPXLine(bundle, period)
      } else {
        return cancelCPXFromDate(bundle, period, cancellationDate)
      }
    } catch (e : Exception) {
      throw new EntityStateException(e.LocalizedMessage)
    }
  }

  private function getCPXStartDate(period : PolicyPeriod) : Date {
    var cpxCoverages = period.INDCPXLine.INDCPXCovs.first().CPXInfoCovs
    return cpxCoverages.minBy(\cov -> cov.PeriodStart).PeriodStart
  }

  private function cancelCPXFromDate(bundle : Bundle, period : PolicyPeriod, cancellationDate : Date) : String {
    LOG.info("cancelCPXFromDate: Cancelling CPX on policy period ${period} from cancellation date ${cancellationDate}")
    var policyChange = new PolicyChange(bundle)
    policyChange.TriggerReason_ACC = ReasonCode.TC_CANCELDELINQUENTCPX_ACC
    policyChange.startJob(period.Policy, period.PeriodStart)
    var newPolicyPeriod = policyChange.LatestPeriod
    var process = newPolicyPeriod.PolicyChangeProcess

    var cpxCov = newPolicyPeriod.INDCPXLine.INDCPXCovs.first()
    var cpxInfoCovs = cpxCov.CPXInfoCovs

    for (cpxInfoCov in cpxInfoCovs) {
      if (cpxInfoCov.PeriodEnd > cancellationDate) {
        if (cpxInfoCov.PeriodStart >= cancellationDate) {
          // Remove CPX coverages that start on or after the cancellation date
          cpxInfoCov.remove()
        } else {
          // End date CPX coverages that start before the cancellation date
          cpxInfoCov.PeriodEnd = cancellationDate
        }
      }
    }
    newPolicyPeriod.CPXCancellationDate_ACC = cancellationDate
    newPolicyPeriod.CPXCancellationType_ACC = CPXCancellationType_ACC.TC_NONPAYMENTSYSTEM

    process.requestQuote()
    process.issueJob(true)

    return newPolicyPeriod.Job.JobNumber
  }

  private function cancelAndRemoveCPXLine(bundle : Bundle, period : PolicyPeriod) : String {
    LOG.info("cancelAndRemoveCPXLine: Cancelling and removing CPX from policy period ${period}")
    var policyChange = new PolicyChange(bundle)
    policyChange.TriggerReason_ACC = ReasonCode.TC_CANCELDELINQUENTCPX_ACC
    policyChange.startJob(period.Policy, period.PeriodStart)
    var newPolicyPeriod = policyChange.LatestPeriod
    var process = newPolicyPeriod.PolicyChangeProcess

    var cpxLinePattern = newPolicyPeriod.Policy.Product.LinePatterns.firstWhere(\p -> p.isAvailable(newPolicyPeriod) && p.PolicyLineSubtype == TC_INDCPXLINE)
    newPolicyPeriod.removeFromLines(newPolicyPeriod.getLine(cpxLinePattern))
    // ChrisA 04/08/2020 JUNO-3688 add cancellation reason and effective cancel date of CPX
    var cancellationDate = period.INDCPXLine.INDCPXCovs.first().CPXInfoCovs.first().PeriodStart
    newPolicyPeriod.CPXCancellationDate_ACC = cancellationDate != null ? cancellationDate : period.PeriodStart
    newPolicyPeriod.CPXCancellationType_ACC = CPXCancellationType_ACC.TC_NONPAYMENTSYSTEM
    newPolicyPeriod.updateTerritoryCodes()

    process.requestQuote()
    process.issueJob(true)

    return newPolicyPeriod.Job.JobNumber
  }

  /**
   * Copied from OOTB CancellationAPI
   */
  @Throws(SOAPException, "If communication errors occur")
  @Throws(RequiredFieldException, "If required field is missing")
  @Throws(BadIdentifierException, "If cannot find entity with given identifier")
  private function retrievePolicyPeriod(policyNumber : String, asOfDate : Date, bundle : Bundle)
  : PolicyPeriod {
    SOAPUtil.require(policyNumber, "policyNumber")
    SOAPUtil.require(asOfDate, "asOfDate")
    var period = Policy.finder.findPolicyPeriodByPolicyNumberAndAsOfDate(policyNumber, asOfDate)
    if (period == null) {
      throw new BadIdentifierException(DisplayKey.get("CancellationAPI.Error.PolicyAndDateNotFound",
          policyNumber, asOfDate))
    }
    period = bundle.add(period)
    return period
  }

}
