package nz.co.acc.plm.integration.instruction.handler

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Bundle
uses gw.util.Pair
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC
uses nz.co.acc.plm.integration.instruction.util.InstructionConstantHelper
uses nz.co.acc.plm.util.ListUtil

uses gw.surepath.suite.integration.logging.StructuredLogger
uses org.joda.time.Interval
uses typekey.*
uses typekey.Job

uses java.lang.invoke.MethodHandles

/**
 * WorkHandler for CPXUpdatesWPS
 */
class CPXUpdatesWPSWorkHandler extends WorkHandlerBase {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  private var _jobNumber: String
  private var _bundle: Bundle

  /**
   * Do work for WPS policy here
   *
   * @param bundle
   */
  override public function doWork(bundle: Bundle) {
    var func = "doWork(String, Bundle)"
    logInfo("Begin: ${func}", "Started")

    _bundle = bundle

    var theCPXPolicyPeriod = findLatestPolicyPeriod(_jobNumber)
    var wpsPolicyPeriodToUpdate = getTargetWPSPolicyPeriod(_policyNumber, theCPXPolicyPeriod.LevyYear_ACC)

    logInfo("${func}", "Started processing policy period: ${theCPXPolicyPeriod.DisplayName}")

    var sheOnCPXContact = theCPXPolicyPeriod.Policy.Account.AccountHolderContact
    logInfo("${func}", "Update related WPS periods for the following account holder contact: ${sheOnCPXContact.DisplayName}")

    if (theCPXPolicyPeriod != null and wpsPolicyPeriodToUpdate != null) {
      logInfo(func, "Started processing CPX policy: ${theCPXPolicyPeriod.DisplayName}")
      theCPXPolicyPeriod = getSlicedPeriod(theCPXPolicyPeriod)

      var sheOnCPXDetailsFromCPXPeriod = extractCPXDetails(theCPXPolicyPeriod, wpsPolicyPeriodToUpdate)

      switch (theCPXPolicyPeriod.Job.Subtype) {
        case typekey.Job.TC_SUBMISSION:
        case Job.TC_REINSTATEMENT:
          logInfo(func, "Find WPS policies, and add CPX details from: ${theCPXPolicyPeriod} to ${wpsPolicyPeriodToUpdate}")
          processAddedCPXDetails(wpsPolicyPeriodToUpdate, sheOnCPXContact, sheOnCPXDetailsFromCPXPeriod)
          break
        case Job.TC_CANCELLATION:
          logInfo(func, "Find WPS policies, and remove CPX details from: ${theCPXPolicyPeriod} to ${wpsPolicyPeriodToUpdate}")
          processRemovedCPXDetails(wpsPolicyPeriodToUpdate, sheOnCPXContact, sheOnCPXDetailsFromCPXPeriod)
          break
        case Job.TC_POLICYCHANGE:
          logInfo(func, "Find WPS policies, and change CPX details from: ${theCPXPolicyPeriod} to ${wpsPolicyPeriodToUpdate}")
          evaluateChangedCPXDetails(theCPXPolicyPeriod, wpsPolicyPeriodToUpdate, sheOnCPXContact, sheOnCPXDetailsFromCPXPeriod)
          break
      }
      logInfo("${func}", "Finished processing CPX policy: ${theCPXPolicyPeriod.DisplayName}")
    }
    logInfo("End: ${func}", "Finished")
  }

  /**
   *  Processes the CPX details @sheOnCPXDetailsFromCPXPeriod that were created on the newly issued CPX period
   *  for a given shareholder on CPX @sheOnCPXContact
   *  so that those details can accurately be reflected on the WPS policy @wpsPeriodToUpdate
   *
   *  For business, this will help WPS in proration depending on the # of days the shareholder employee has been on CPX
   *
   * @param wpsPeriodToUpdate
   * @param sheOnCPXContact
   * @param sheOnCPXDetailsFromCPXPeriod
   */
  private function processAddedCPXDetails(wpsPeriodToUpdate: PolicyPeriod, sheOnCPXContact: Contact, sheOnCPXDetailsFromCPXPeriod: CPXDetails) {
    var func = "processAddedCPXDetails"
    logDebug("Begin: ${func}", "")
    logDebug(func, "Going to process (add case) the following WPS policy period: ${wpsPeriodToUpdate} for SHE on CPX Contact: ${sheOnCPXContact}")

    if (wpsPeriodToUpdate != null) {

      wpsPeriodToUpdate = getSlicedPeriod(wpsPeriodToUpdate)
      logDebug(func, "Evaluate and add CPX details from {theCPXPolicyPeriod} to WPS ${wpsPeriodToUpdate} for the contact: ${sheOnCPXContact}")

      for (theSHEOnCPX in wpsPeriodToUpdate.CWPSLine.PolicyShareholders.where(\eachPolicyShareholder -> eachPolicyShareholder.PolicyContact == sheOnCPXContact)) {
        var allSHECPXDetailsForAShareholder = theSHEOnCPX.getPolicySHECPXDetails()

        //Prepare a list of intervals on wps policy for this particular shareholder
        var wpsIntervalList = new ArrayList<Interval>()
        allSHECPXDetailsForAShareholder.each(\eachSHECPXDetail -> wpsIntervalList.add(new Interval(eachSHECPXDetail.cpxStartDate.getTime(), eachSHECPXDetail.cpxEndDate.getTime())))

        //Prepare a list of intervals from the cpx period
        var cpxIntervalList = new ArrayList<Interval>()
        sheOnCPXDetailsFromCPXPeriod?.cpxPolicyDates.each(\eachCPXDatePair -> cpxIntervalList.add(new Interval(eachCPXDatePair.First.getTime(), eachCPXDatePair.Second.getTime())))

        // Do we have any CPX date intervals to add and that they are not added on WPS policy already
        if (cpxIntervalList.size() > 0 and !ListUtil.cmp(wpsIntervalList, cpxIntervalList)) {
          logDebug(func, "${theSHEOnCPX.PolicyContact} CPX details on WPS policy does not match what we have on CPX policy, therefore adding it under contact: on policy: ${wpsPeriodToUpdate.PolicyNumber}")
          updateCPXDetailsAndIssueWPS(wpsPeriodToUpdate, theSHEOnCPX, sheOnCPXDetailsFromCPXPeriod, Job.TC_SUBMISSION.Code)
        }
      }
    }
    logDebug("End: ${func}", "")
  }

  /**
   * Applies the incoming cpx details (already updated) and issues the WPS period
   *
   * @param theWPSPolicyPeriod
   * @param thePolicyShareholderContact
   * @param shareholdersOnCPXDetails
   * @param jobType
   */
  private function updateCPXDetailsAndIssueWPS(theWPSPolicyPeriod: PolicyPeriod, thePolicyShareholderContact: PolicyShareholder_ACC, shareholdersOnCPXDetails: CPXDetails, jobType: String) {
    var func = "updateCPXDetailsAndIssueWPS"
    logInfo("Begin: ${func}", "Going to change the following WPS policy: ${theWPSPolicyPeriod}")

    if (theWPSPolicyPeriod.hasFinalAuditFinished()) {
      // Do not issue a change if the policy has any audits on it - revise the audt instead
      var auditInformation: AuditInformation

      theWPSPolicyPeriod = _bundle.add(theWPSPolicyPeriod)
      // We do have a final audit on the policy, go revise the audit
      var revisedWPSPeriod = getLatestAuditPeriod(theWPSPolicyPeriod).Audit.revise()

      auditInformation = (revisedWPSPeriod.Job as Audit).AuditInformation
      auditInformation = _bundle.add(auditInformation)
      logDebug(func, "Preparing audit revision for: ${revisedWPSPeriod}")

      revisedWPSPeriod.Job.setTriggerReason_ACC(ReasonCode.TC_CPXUPDATESWPS_ACC)
      // Populate audit info
      setAuditInfo(auditInformation)

      // Set CPX details on WPS (may need to add/change them
      addOrChangeCPXDetailsOnWPS(revisedWPSPeriod, thePolicyShareholderContact, shareholdersOnCPXDetails, jobType)

      // Finally, request and complete the latest audit
      var auditProcess = auditInformation.Audit.LatestPeriod.AuditProcess
      auditProcess.requestQuote()
      auditProcess.complete()
      _bundle.commit()
    } else {
      // open a change job from the wpsPeriod which we need to update
      var policyChange = new PolicyChange(_bundle)
      var effDate = theWPSPolicyPeriod.PeriodStart
      policyChange.startJob(theWPSPolicyPeriod.Policy, effDate)

      // Set the cpx details on WPS (may need to add/change them
      var wpsChangePeriod = policyChange.LatestPeriod
      logDebug(func, "preparing change for: ${wpsChangePeriod}")
      wpsChangePeriod.Job.setTriggerReason_ACC(ReasonCode.TC_CPXUPDATESWPS_ACC)

      // Add/Remove/Update cpx details
      addOrChangeCPXDetailsOnWPS(wpsChangePeriod, thePolicyShareholderContact, shareholdersOnCPXDetails, jobType)

      // Finally, request quote, bind and issue
      wpsChangePeriod.PolicyChangeProcess.requestQuote()
      wpsChangePeriod.PolicyChangeProcess.issueJob(true)
      _bundle.commit()
    }
    logInfo("End: ${func}", "Finished changing the following WPS policy: ${theWPSPolicyPeriod}")
  }

  private function addOrChangeCPXDetailsOnWPS(wpsPeriod: PolicyPeriod, thePolicyShareholderContact: PolicyShareholder_ACC, shareholdersOnCPXDetails: CPXDetails, jobType: String) {
    switch (jobType) {
      case Job.TC_SUBMISSION.Code:
      case Job.TC_REINSTATEMENT.Code:
        appendCPXDetailsToThePeriod(wpsPeriod, thePolicyShareholderContact, shareholdersOnCPXDetails)
        break
      case Job.TC_POLICYCHANGE.Code:
        changeCPXDetailsOnThePeriod(wpsPeriod, thePolicyShareholderContact, shareholdersOnCPXDetails)
        break
    }
  }

  /**
   * Helper function for appending the provided details on the period for a given share holder contact
   *
   * @param policyPeriod
   * @param thePolicyShareholderContact
   * @param shareholdersOnCPXDetails
   */
  private function appendCPXDetailsToThePeriod(policyPeriod: PolicyPeriod, thePolicyShareholderContact: PolicyShareholder_ACC, shareholdersOnCPXDetails: CPXDetails) {
    // For holding multiple cpx details so we can add in one go
    logDebug("appendCPXDetailsToThePeriod", "Going to add the following details: ${shareholdersOnCPXDetails} for ${thePolicyShareholderContact.PolicyContact} on policy ${policyPeriod}")
    var allCPXDetails = createNewSHECPXDetails(policyPeriod, shareholdersOnCPXDetails)

    // i) Get to the target shareholder employees we need to append
    var policyShareholdersFromWPS = policyPeriod.CWPSLine.PolicyShareholders.where(\policyContactObj -> policyContactObj.PolicyContact == thePolicyShareholderContact.PolicyContact)

    for (eachShareholderFromWPS in policyShareholdersFromWPS) {
      allCPXDetails.each(\eachCPXDetail -> updatePolicyShareholder(eachShareholderFromWPS, eachCPXDetail))

      // ii) compute all she earnings and issue policy
      eachShareholderFromWPS.computeAllShareholderEarnings()
    }
  }

  private function updatePolicyShareholder(eachShareholderFromWPS : PolicyShareholder_ACC, cpxDetail : PolicySHECPXDetails_ACC) {
    if(!eachShareholderFromWPS.PolicySHECPXDetails.hasMatch(\elt1 -> elt1.cpxStartDate.compareIgnoreTime(cpxDetail.cpxStartDate) == 0 and
                                                                     elt1.cpxEndDate.compareIgnoreTime(cpxDetail.cpxEndDate) == 0)) {
      eachShareholderFromWPS.addToPolicySHECPXDetails(cpxDetail)
    } else {
      logDebug("appendCPXDetailsToThePeriod", "Change not needed ${cpxDetail}")
    }
  }

  /**
   * Helper function for updating the provided details on the period for a given share holder contact
   *
   * @param policyPeriod
   * @param thePolicyShareholderContact
   * @param shareholdersOnCPXDetails
   */
  private function changeCPXDetailsOnThePeriod(policyPeriod: PolicyPeriod, thePolicyShareholderContact: PolicyShareholder_ACC, shareholdersOnCPXDetails: CPXDetails) {
    var func = "changeCPXDetailsOnThePeriod"
    logDebug("Begin: ${func}", "")

    // For holding multiple cpx details so we can add in one go
    var allCPXDetails = createNewSHECPXDetails(policyPeriod, shareholdersOnCPXDetails)

    // i) Get to the target shareholder employees we need to update
    var policyShareholdersFromCWPS = policyPeriod?.CWPSLine.PolicyShareholders
        .where(\sheFromCWPS -> sheFromCWPS?.PolicyContact == thePolicyShareholderContact.PolicyContact)

    for (eachShareholderFromCWPS in policyShareholdersFromCWPS) {
      // ii) For each shareholder employee, remove cpx dates from the associated cwps policy
      var detailsToRemove = eachShareholderFromCWPS.PolicySHECPXDetails.where(\elt -> elt.policyNumber == shareholdersOnCPXDetails.cpxPolicyNumber)
      logDebug("${func}", "Going to remove the following details: ${detailsToRemove} from ${policyPeriod} for ${eachShareholderFromCWPS.PolicyContact}")
      detailsToRemove.each(\elt -> eachShareholderFromCWPS.removeFromPolicySHECPXDetails(elt))

      logDebug("${func}", "Going to add the following details: ${allCPXDetails} from ${policyPeriod} for ${eachShareholderFromCWPS.PolicyContact}")
      // iii) Create and then add current details from the associated cpx period into cwps policy

      allCPXDetails.each(\elt -> {
        eachShareholderFromCWPS.addToPolicySHECPXDetails(elt)
      })
      // iv) compute all she earnings and issue policy
      eachShareholderFromCWPS.computeAllShareholderEarnings()
    }
    logDebug("End: ${func}", "")
  }

  /**
   *  Based on the current CPX policy period @theCPXPolicyPeriod, this method will process the CPX details @sheOnCPXDetailsFromCPXPeriod
   *  for a given shareholder on CPX @sheOnCPXContact
   *  so that those details can accurately be reflected on the WPS policy @wpsPeriodToUpdate
   *
   * @param theCPXPolicyPeriod
   * @param wpsPolicyPeriod
   * @param sheOnCPXContact
   * @param sheOnCPXDetailsFromCPXPeriod
   */
  private function evaluateChangedCPXDetails(theCPXPolicyPeriod: PolicyPeriod, wpsPolicyPeriod: PolicyPeriod, sheOnCPXContact: Contact, sheOnCPXDetailsFromCPXPeriod: CPXDetails) {
    if (theCPXPolicyPeriod.BasedOn.INDCPXLineExists and !theCPXPolicyPeriod.INDCPXLineExists and theCPXPolicyPeriod.Status == TC_BOUND) {
      // Change scenario 1 - CPX -> CP (we shall take the cpx dates off relevant WPS policies
      sheOnCPXDetailsFromCPXPeriod = extractCPXDetails(theCPXPolicyPeriod.BasedOn, wpsPolicyPeriod) // For removal we will need the BasedOn period
      processRemovedCPXDetails(wpsPolicyPeriod, sheOnCPXContact, sheOnCPXDetailsFromCPXPeriod)
    } else if (!theCPXPolicyPeriod.BasedOn.INDCPXLineExists and theCPXPolicyPeriod.INDCPXLineExists and theCPXPolicyPeriod.Status == TC_BOUND) {
      // Change scenario 2 - CPX -> CP (we shall add the cpx dates on relevant WPS policies
      processAddedCPXDetails(wpsPolicyPeriod, sheOnCPXContact, sheOnCPXDetailsFromCPXPeriod)
    } else if (theCPXPolicyPeriod.BasedOn.INDCPXLineExists and theCPXPolicyPeriod.INDCPXLineExists and theCPXPolicyPeriod.Status == TC_BOUND) {
      // Change scenario 3 - CPX -> CPX (we shall update the cpx dates on relevant WPS policies incase they have changed
      processModifiedCPXDetails(wpsPolicyPeriod, sheOnCPXContact, sheOnCPXDetailsFromCPXPeriod)
    }
  }

  /**
   *  Processes the CPX details @sheOnCPXDetailsFromCPXPeriod that were modified on the CPX period
   *  for a given shareholder on CPX @sheOnCPXContact
   *  so that those details can accurately be reflected on the WPS policy @wpsPeriodToUpdate
   *
   * @param wpsPeriodToUpdate
   * @param sheOnCPXContact
   * @param sheOnCPXDetailsFromCPXPeriod
   */
  private function processModifiedCPXDetails(wpsPeriodToUpdate: PolicyPeriod, sheOnCPXContact: Contact, sheOnCPXDetailsFromCPXPeriod: CPXDetails) {
    var func = "processModifiedCPXDetails"
    logDebug("Begin: ${func}", "")
    logDebug(func, "Going to process (update case) the following WPS policy period: ${wpsPeriodToUpdate} for SHE on CPX Contact: ${sheOnCPXContact}")

    if (wpsPeriodToUpdate != null) {
      wpsPeriodToUpdate = getSlicedPeriod(wpsPeriodToUpdate)
      logDebug(func, "Investigating the following WPS policy for shareholder detail update: ${wpsPeriodToUpdate.PolicyNumber}")
      logDebug(func, "CPX Details from the CPX period (based on)  ${sheOnCPXDetailsFromCPXPeriod.cpxPolicyNumber}: ${sheOnCPXDetailsFromCPXPeriod.cpxPolicyDates}")

      // For each shareholder on cpx, get the CPX intervals from the cpx policy
      for (theSHEOnCPX in wpsPeriodToUpdate.CWPSLine.PolicyShareholders.where(\eachPolicyShareholder -> eachPolicyShareholder.PolicyContact == sheOnCPXContact)) {
        var allSHECPXDetailsForAShareholder = theSHEOnCPX.getPolicySHECPXDetails()

        //Prepare a list of intervals from cpx start and end dates for this particular shareholder on cpx
        var wpsIntervalList = new ArrayList<Interval>()
        allSHECPXDetailsForAShareholder.each(\eachSHECPXDetail -> wpsIntervalList.add(new Interval(eachSHECPXDetail.cpxStartDate.getTime(), eachSHECPXDetail.cpxEndDate.getTime())))
        logDebug(func, "wpsIntervalList (unadjusted) from the target WPS policy: ${wpsIntervalList}")

        var adjustedCPXIntervals = new ArrayList<Interval>()
        var adjustedCPXDates = INDCPXCovUtil_ACC.adjustCPXDatesForWPS(sheOnCPXDetailsFromCPXPeriod?.cpxPolicyDates, new Pair(wpsPeriodToUpdate.PolicyStartDate.trimToMidnight(), wpsPeriodToUpdate.PolicyEndDate.trimToMidnight()))
        adjustedCPXDates.each(\eachAdjCPXDate -> adjustedCPXIntervals.add(new Interval(eachAdjCPXDate.First.trimToMidnight().getTime(), eachAdjCPXDate.Second.trimToMidnight().Time)))
        logDebug(func, "wpsIntervalList (adjusted with wps policy date) from the target WPS policy: ${adjustedCPXIntervals}")

        // If the WPS policy does not match the intervals we have on the issued CPX, add them all
        if (wpsIntervalList?.equals(adjustedCPXIntervals)) {
          logInfo(func, "WPS IntervalList ${wpsIntervalList} from the target WPS policy is equal to CPX policy interval list  ${adjustedCPXIntervals}, therefore no updates necessary on WPS policy: ${wpsPeriodToUpdate.PolicyNumber}")
        } else {
          logInfo(func, "Going to update Shareholder (${theSHEOnCPX.PolicyContact}) CPX Details on WPS policy ${wpsPeriodToUpdate.PolicyNumber}")
          updateCPXDetailsAndIssueWPS(wpsPeriodToUpdate, theSHEOnCPX, sheOnCPXDetailsFromCPXPeriod, Job.TC_POLICYCHANGE.Code)
        }
      }
    }
    logDebug("End: ${func}", "")
  }

  /**
   *  Processes the CPX details @sheOnCPXDetailsFromCPXPeriod that were removed from the CPX period as a result of cancellation
   *  for a given shareholder on CPX @sheOnCPXContact
   *  so that those details can accurately be reflected on the WPS policy @wpsPeriodToUpdate
   *
   * @param wpsPeriodToUpdate
   * @param sheOnCPXContact
   * @param sheOnCPXDetailsFromCPXPeriod
   */
  private function processRemovedCPXDetails(wpsPeriodToUpdate: PolicyPeriod, sheOnCPXContact: Contact, sheOnCPXDetailsFromCPXPeriod: CPXDetails) {
    var func = "processRemovedCPXDetails"
    logDebug("Begin: ${func}", "")
    logDebug(func, "Going to process (removal case) the following WPS policy period: ${wpsPeriodToUpdate} for SHE on CPX Contact: ${sheOnCPXContact}")

    if (wpsPeriodToUpdate != null) {
      wpsPeriodToUpdate = getSlicedPeriod(wpsPeriodToUpdate)
      logDebug(func, "Evaluate and remove CPX details from {theCPXPolicyPeriod} to WPS ${wpsPeriodToUpdate} for the contact: ${sheOnCPXContact}")
      logDebug(func, "CPX (before WPS adjustment) Details from the CPX period  ${sheOnCPXDetailsFromCPXPeriod.cpxPolicyNumber}: ${sheOnCPXDetailsFromCPXPeriod.cpxPolicyDates}")

      for (theCancellingSHEOnCPX in wpsPeriodToUpdate.CWPSLine.PolicyShareholders.where(\eachPolicyShareholder -> eachPolicyShareholder.PolicyContact == sheOnCPXContact)) {
        var allSHECPXDetailsForAShareholder = theCancellingSHEOnCPX.getPolicySHECPXDetails()

        // Adjustment needed for cpx policies where the cpx start date had been adjusted
        var adjustedCPXDates = INDCPXCovUtil_ACC.adjustCPXDatesForWPS(sheOnCPXDetailsFromCPXPeriod?.cpxPolicyDates, new Pair(wpsPeriodToUpdate.PeriodStart, wpsPeriodToUpdate.PeriodEnd))
        logDebug(func, "CPX (after WPS adjustment) Details from the CPX period ${sheOnCPXDetailsFromCPXPeriod.cpxPolicyNumber}: ${adjustedCPXDates}")
        // For holding multiple cpx details so we can remove in one go
        var cpxDetailsToRemoveFromWPS = new ArrayList<PolicySHECPXDetails_ACC>()
        for (eachAdjustedCPXDate in adjustedCPXDates) {
          var wpsCPXDetailsToremove = allSHECPXDetailsForAShareholder.where(\eachCPXDetail ->
              eachCPXDetail.policyNumber == sheOnCPXDetailsFromCPXPeriod.cpxPolicyNumber
                  and eachCPXDetail.cpxStartDate.compareIgnoreTime(eachAdjustedCPXDate.First) == 0
                  and eachCPXDetail.cpxEndDate.compareIgnoreTime(eachAdjustedCPXDate.Second) == 0)
          // If the WPS policy contains the intervals we have on the issued CPX, collect them to be removed
          if (wpsCPXDetailsToremove != null) {
            logInfo(func, "For contact: ${theCancellingSHEOnCPX.PolicyContact.DisplayName}, remove cpx dates ${sheOnCPXDetailsFromCPXPeriod.cpxPolicyDates} from: ${wpsPeriodToUpdate.PolicyNumber}")
            cpxDetailsToRemoveFromWPS.addAll(wpsCPXDetailsToremove.toList())
          }
        }
        if (cpxDetailsToRemoveFromWPS.Count > 0) {
          removeCPXDetailsAndIssueWPS(wpsPeriodToUpdate, theCancellingSHEOnCPX, cpxDetailsToRemoveFromWPS)
        } else {
          logInfo(func, "For contact: ${theCancellingSHEOnCPX.PolicyContact.DisplayName}, no cpx dates were removed from policy # ${wpsPeriodToUpdate.PolicyNumber}")
        }
      }
    }
    logDebug("End: ${func}", "")
  }

  /**
   * Removes cpx details, if necessary, for all shareholders on the WPS policy and issues a policy change / audit revision
   *
   * @param theWPSPolicyPeriod
   * @param policyShareHolder
   * @param detailsToRemove
   * @param bundle
   */
  private function removeCPXDetailsAndIssueWPS(theWPSPolicyPeriod: PolicyPeriod, policyShareHolder: PolicyShareholder_ACC, detailsToRemove: ArrayList<PolicySHECPXDetails_ACC>) {
    var func = "removeCPXDetailsAndIssueWPS"
    logDebug("Begin: {$func}", "Started removing CPX Details from the following wps period: ${theWPSPolicyPeriod}")

    if (theWPSPolicyPeriod.hasFinalAuditFinished()) {
      // Do not issue a change if the policy has any audits on it - revise the audit instead
      var auditInformation: AuditInformation
      // open an audit job
      theWPSPolicyPeriod = _bundle.add(theWPSPolicyPeriod)
      // We do have a final audit on the policy, go revise the audit
      var revisedWPSPeriod = getLatestAuditPeriod(theWPSPolicyPeriod).Audit.revise()
      auditInformation = (revisedWPSPeriod.Job as Audit).AuditInformation
      auditInformation = _bundle.add(auditInformation)
      logDebug(func, "Preparing audit revision for: ${revisedWPSPeriod}")
      // Populate audit info
      setAuditInfo(auditInformation)
      // Remove cpx details from the audit revision
      removeCPXDetailsFromThePeriod(revisedWPSPeriod, policyShareHolder, detailsToRemove)

      // Finally, request and complete the latest audit
      var auditProcess = auditInformation.Audit.LatestPeriod.AuditProcess
      auditProcess.requestQuote()
      auditProcess.complete()
    } else {
      // open a change job from the wpsPeriod which we need to update
      var policyChange = new PolicyChange(_bundle)
      var effDate = theWPSPolicyPeriod.PeriodStart
      policyChange.startJob(theWPSPolicyPeriod.Policy, effDate)

      //Get the change period that we would like to modify
      var wpsChangePeriod = policyChange.LatestPeriod
      logDebug(func, "preparing change for: ${wpsChangePeriod}")

      wpsChangePeriod.Job.setTriggerReason_ACC(ReasonCode.TC_CPXUPDATESWPS_ACC)
      // Remove cpx details from the wps change period
      removeCPXDetailsFromThePeriod(wpsChangePeriod, policyShareHolder, detailsToRemove)

      // Finally, request quote, bind and issue
      wpsChangePeriod.PolicyChangeProcess.requestQuote()
      wpsChangePeriod.PolicyChangeProcess.issueJob(true)
      _bundle.commit()
    }
    logDebug("End: ${func}", "Finished removing CPX Details from the following wps period: ${theWPSPolicyPeriod}")
  }

  /**
   * Helper function for removing CPX details from the period
   *
   * @param policyPeriod
   * @param policyShareHolder
   * @param detailsToRemove
   */
  private function removeCPXDetailsFromThePeriod(policyPeriod: PolicyPeriod, policyShareHolder: PolicyShareholder_ACC, detailsToRemove: ArrayList<PolicySHECPXDetails_ACC>) {
    // i) Get to the target shareholder employees we need to update
    var policyShareholdersFromWPS = policyPeriod?.CWPSLine.PolicyShareholders
        .where(\sheFromWPS -> sheFromWPS?.PolicyContact == policyShareHolder.PolicyContact)

    for (eachShareholderFromWPS in policyShareholdersFromWPS) {
      // ii) For each shareholder employee, remove cpx dates from the associated wps policy
      for (eachPolicySHECPXDetail in detailsToRemove) {
        var eachPolicySHECPXDetailFromChangePrd = eachShareholderFromWPS.PolicySHECPXDetails.where(\sheFromWPSDetails ->
            sheFromWPSDetails.cpxStartDate.compareIgnoreTime(eachPolicySHECPXDetail.cpxStartDate) == 0 and
                sheFromWPSDetails.cpxEndDate.compareIgnoreTime(eachPolicySHECPXDetail.cpxEndDate) == 0 and
                sheFromWPSDetails.policyNumber == eachPolicySHECPXDetail.policyNumber)
        logDebug("removeCPXDetailsFromThePeriod", "Going to remove the following details: ${eachPolicySHECPXDetailFromChangePrd} from ${policyPeriod} for {eachShareholderFromWPS.PolicyContact}")
        eachPolicySHECPXDetailFromChangePrd.each(\everySHEDetail -> eachShareholderFromWPS.removeFromPolicySHECPXDetails(everySHEDetail))
      }
      // iii) compute all she earnings and issue policy
      eachShareholderFromWPS.computeAllShareholderEarnings()
    }
  }

  /**
   * Helper function to extract desired CPX details that will later be updated on WPS
   *
   * @param cpxPolicyPeriod
   * @param wpsPolicyPeriod
   * @return CPX details
   */
  private function extractCPXDetails(cpxPolicyPeriod: PolicyPeriod, wpsPolicyPeriod: PolicyPeriod): CPXDetails {
    var cpxDetailsForWPS = new CPXDetails()

    cpxDetailsForWPS.cpxPolicyNumber = cpxPolicyPeriod.PolicyNumber

    var wpsStart = wpsPolicyPeriod.PeriodStart
    var wpsEnd = wpsPolicyPeriod.PeriodEnd

    for (eachCPXInfoCov in cpxPolicyPeriod.INDCPXLine.INDCPXCovs*.CPXInfoCovs) {
      var cpxStart = eachCPXInfoCov.PeriodStart
      var cpxEnd = eachCPXInfoCov.PeriodEnd

      if (!DateUtil_ACC.isDateRangeCompletelyOutside(new Pair(cpxStart, cpxEnd), new Pair(wpsStart, wpsEnd))) {
        cpxDetailsForWPS.cpxPolicyDates.add(new Pair(eachCPXInfoCov.PeriodStart, eachCPXInfoCov.PeriodEnd))
      }
    }

    return cpxDetailsForWPS
  }

  private function getTargetWPSPolicyPeriod(policyNumber: String, yearOfDate: Integer): PolicyPeriod {

    // Get the WPS policy period we need to process
    var targetWPSPolicy = findUncancelledPolicyByNumber(policyNumber)
    var filteredWPSPeriods: PolicyPeriod[] = {}

    if (targetWPSPolicy != null) {
      // Filter down to the desired WPS policy/audit periods that haven't been rewritten
      filteredWPSPeriods = targetWPSPolicy.Periods.where(\policyPeriod ->
          policyPeriod.LevyYear_ACC == yearOfDate and
              policyPeriod.CancellationDate == null and
              (policyPeriod.Status == PolicyPeriodStatus.TC_AUDITCOMPLETE or policyPeriod.Status == PolicyPeriodStatus.TC_BOUND) and
              policyPeriod.Policy.RewrittenToNewAccountDestination == null
      )
    }

    // Pick up the latest policy period by sorting on the update time descending and then the model number descending.
    // If the model number is null then it is sorted to be at the top (i.e the latest).
    return filteredWPSPeriods.orderByDescending(\eachPeriod -> eachPeriod.UpdateTime).thenByDescending(\eachPeriod -> eachPeriod.ModelNumber?:Integer.MAX_VALUE).first()
  }

  /**
   * Helper function for getting the uncancelled policy by its @policyNumber
   * @param policyNumber
   *
   * @return the Policy
   */
  private function findUncancelledPolicyByNumber(policyNumber: String): Policy {

    var policyQry = Query.make(Policy)
    policyQry.withDistinct(true)
    var periodTable = policyQry.join(PolicyPeriod, "Policy")
    periodTable.compare("PolicyNumber", Relop.Equals, policyNumber)

    periodTable.and(\andRes -> {
      andRes.or(\orRes -> {
        orRes.compare("CancellationDate", Equals, null) // Not cancelled
      })
    })

    var resultPolicy = policyQry.select()

    return resultPolicy.Empty ? null : resultPolicy.FirstResult
  }

  /**
   * Utility function to create cpx details (adjusted with WPS) to go on the wps period
   *
   * @param wpsChangePeriod
   * @param cpxDetails
   * @return
   */
  private function createNewSHECPXDetails(wpsChangePeriod: PolicyPeriod, cpxDetails: CPXDetails): ArrayList<PolicySHECPXDetails_ACC> {
    // Get latest from CPX policy
    var latestCPXIntervals = new ArrayList<Pair<Date, Date>>()
    cpxDetails?.cpxPolicyDates.each(\eachCPXDatePair -> latestCPXIntervals.add(eachCPXDatePair))

    // Align dates (from cpx) with the WPS policy period
    var adjustedCPXDates = INDCPXCovUtil_ACC.adjustCPXDatesForWPS(latestCPXIntervals, new Pair(wpsChangePeriod.PolicyStartDate, wpsChangePeriod.PolicyEndDate))

    var allCPXDetails = new ArrayList<PolicySHECPXDetails_ACC>()
    for (eachAdjustedCPXDate in adjustedCPXDates) {
      var details = new PolicySHECPXDetails_ACC(wpsChangePeriod)
      details.cpxStartDate = eachAdjustedCPXDate.First
      details.cpxEndDate = eachAdjustedCPXDate.Second
      details.policyNumber = cpxDetails.cpxPolicyNumber
      logInfo("createNewSHECPXDetails", "Creating CPX details (${details.policyNumber} : ${details.cpxStartDate} - ${details.cpxEndDate}) for adding to following WPS period: ${wpsChangePeriod}")
      allCPXDetails.add(details)
    }
    return allCPXDetails
  }

  /**
   * Helper function for setting hte audit job info
   *
   * @param auditInformation
   */
  private function setAuditInfo(auditInformation: AuditInformation) {
    var auditReceivedDate = Date.CurrentDate
    var auditInitDate = Date.CurrentDate
    var auditMethod = AuditMethod.TC_MANUAL_ACC
    auditInformation.ReceivedDate = auditReceivedDate
    auditInformation.InitDate = auditInitDate
    auditInformation.ActualAuditMethod = auditMethod
    auditInformation.AuditMethod = auditMethod
  }

  /**
   * Checks if the final audit is completed for the policy period, if yes, then it returns the latest completed audit period
   * If the policy hasnt had any final audits, it simply returns the same policy period
   *
   * @param policyPeriod
   * @return
   */
  private function getLatestAuditPeriod(policyPeriod: PolicyPeriod): PolicyPeriod {
    var latestFinalAuditPolicyPeriod: PolicyPeriod
    if (policyPeriod.hasFinalAuditFinished()) {
      // Get the latest final audit period
      latestFinalAuditPolicyPeriod = policyPeriod.CompletedNotReversedFinalAudits.sortBy(\auditInfo -> auditInfo.CreateTime).last()?.Audit?.PolicyPeriod
    }
    return latestFinalAuditPolicyPeriod
  }

  /**
   * Load the Parameters.
   * <p>
   * The expected values are "[JobNumber],[PolicyNumber]"
   */
  override public function loadParameters() {
    var params = this.InstructionWorker.Parameters

    var values: String[]
    if (params != null) {
      values = params.split(InstructionConstantHelper.CSV_DELIMITER)
    }
    if (values == null || values.length != 2) {
      throw new DisplayableException("Invalid Parameters [${params}]")
    }
    _jobNumber = values[0]
    _policyNumber = values[1]
  }

  /**
   * Utility method to return the latest policy period from a job number
   *
   * @param jobNumber
   * @return the latest policy period
   */
  private function findLatestPolicyPeriod(jobNumber: String): PolicyPeriod {
    return entity.Job.finder.findJobByJobNumber(jobNumber).LatestPeriod
  }

  /**
   * Just to get the right slice
   *
   * @param thePeriod
   * @return
   */
  private function getSlicedPeriod(thePeriod: PolicyPeriod): PolicyPeriod {
    return thePeriod.getSlice(thePeriod.PeriodEnd.addMinutes(-1))
  }

  /**
   * Inner class for holding CPX Details that will be passed on to WPS
   * For each policy we can have multiple pair of dates (effective, expiration)
   */
  private class CPXDetails {
    var cpxPolicyNumber: String
    var cpxPolicyDates: List<Pair<Date, Date>>

    construct() {
      cpxPolicyNumber = ""
      cpxPolicyDates = new ArrayList<Pair<Date, Date>>()
    }

    construct(policyNumber: String, policyStarts: List<Pair<Date, Date>>) {
      cpxPolicyNumber = policyNumber
      cpxPolicyDates = policyStarts
    }
  }

  /**
   * Utility  method for logging info messages
   *
   * @param fn
   * @param msg
   */
  private function logInfo(fn: String, msg: String) {
_logger.info(msg)
  }

  /**
   * Utility  method for logging debug messages
   *
   * @param fn
   * @param msg
   */
  private function logDebug(fn: String, msg: String) {
    _logger.debug(msg)
  }

}