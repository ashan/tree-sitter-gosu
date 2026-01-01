package nz.co.acc.plm.integration.files.outbound.letter

uses gw.api.util.CurrencyUtil
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.common.integration.files.outbound.letter.MailhouseFieldFormat
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC
uses nz.co.acc.plm.integration.files.outbound.OutboundConstants

uses java.math.BigDecimal

/**
 * Specific action class for the Mailhouse Cancellation CPX letters .
 */
class CpxCancellationLetterAction extends CpxLetterAction {

  construct(type : OutBoundRecordType_ACC, bundle : Bundle) {
    super(type, bundle)
  }

  override function captureFull(entity : KeyableBean) {
    var policyPeriod = entity as PolicyPeriod

    var cpxOfferLetterData = new CpxOfferLetterData()
    this.capturePolicyOfferDetails(cpxOfferLetterData, policyPeriod)

    var account = policyPeriod.Policy.Account
    captureAccountDetails(cpxOfferLetterData, account)

    cpxOfferLetterData.PolicyStartDate = getCPXStartDate(policyPeriod)
    cpxOfferLetterData.PolicyEndDate = getCPXEndDate(policyPeriod)
    cpxOfferLetterData.CancellationDate = MailhouseFieldFormat.longDateFormat(policyPeriod.CPXCancellationDate_ACC)
    cpxOfferLetterData.CancellationReason = policyPeriod.CPXCancellationType_ACC.DisplayName
    cpxOfferLetterData.MinimumCPXCover = INDCPXCovUtil_ACC.findMinMaxCPXValues(policyPeriod.PeriodStart).First

    var data = cpxOfferLetterData.toXML(nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel.CpxOfferLetterData)
    var accountNumber = policyPeriod.Policy.Account.ACCID_ACC

    var record = newRecord(
        accountNumber,
        policyPeriod.Class.Name,
        policyPeriod.ID.Value,
        data,
        0bd.toMonetaryAmount(),
        policyPeriod.PolicyNumber,
        AddressPolicyType_ACC.TC_CPCPX.Code)

    setInValidAddressStatus(cpxOfferLetterData, record)
  }

  override function capturePolicyOfferDetails(letterData : CpxOfferLetterData, policyPeriod : PolicyPeriod) {
    letterData.PolicyLine = OutboundConstants.CancellationDefaultPolicyLine
    letterData.ProductName = policyPeriod.Policy.Product.Name
  }

  private function getCPXStartDate(policyPeriod : PolicyPeriod) : Date {
    var cpxPeriod = policyPeriod
    if (not policyPeriod.INDCPXLineExists) {
      // Use the last known CPX start date if CPX policy line was removed.
      cpxPeriod = policyPeriod.BasedOn
    }

    /*
      Iterating coverages in reverse order,
      this code finds the period start of the earliest coverage that has no gaps in coverage after it

      E.g. suppose there are CPX coverages with dates:
        01 April - 01 June
        03 June - 01 December
        03 December - 01 February
        02 February - 31 March

     then 03 December is the CPX start date, since the two coverages before it have gaps
     */
    var cpxCovsInReverseOrder = cpxPeriod.INDCPXLine.INDCPXCovs.single().CPXInfoCovs.sortByDescending(\cov -> cov.PeriodStart).toList()
    var nextCov = cpxCovsInReverseOrder.first()
    cpxCovsInReverseOrder.remove(0)

    for (previousCov in cpxCovsInReverseOrder) {
      if (previousCov.PeriodEnd < nextCov.PeriodStart.addDays(-1)) {
        return nextCov.PeriodStart
      } else {
        nextCov = previousCov
      }
    }

    return nextCov.PeriodStart
  }

  private function getCPXEndDate(policyPeriod : PolicyPeriod) : Date {
    if (not policyPeriod.INDCPXLineExists) {
      // Use the cancellation date if CPX policy line was removed
      return policyPeriod.CPXCancellationDate_ACC
    } else {
      var lastCPXCoverageEndDate = policyPeriod.INDCPXLine.INDCPXCovs.single().CPXInfoCovs.maxBy(\cov -> cov.PeriodEnd).PeriodEnd
      return lastCPXCoverageEndDate
    }
  }

}