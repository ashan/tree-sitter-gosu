package nz.co.acc.integration.junoinformationservice.payloadgenerator.policy

uses gw.api.system.server.ServerUtil
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicyTerm
uses nz.co.acc.integration.junoinformationservice.model.policy.IGSONPolicyLine

uses java.math.BigDecimal
uses java.text.SimpleDateFormat

/**
 * Uses code copied from Portal plugins
 */
class PolicyTermGsonGenerator {

  /**
   * Must be thread-safe to avoid invalid IDs in multithreaded context
   */
  final static var DATEFORMATTER : ThreadLocal<SimpleDateFormat> = new ThreadLocal<SimpleDateFormat>() {
    override protected function initialValue() : SimpleDateFormat {
      return new SimpleDateFormat("yyyyMMdd");
    }
  }

  function generate(entity : PolicyPeriod) : GSONPolicyTerm {
    if (entity == null) {
      return null
    }

    final var isAepMember = entity.IsAEPMemberPolicy_ACC

    var gsonDoc = new GSONPolicyTerm()

    var policyPeriod = entity
    var accPolicyID = policyPeriod.ACCPolicyID_ACC

    gsonDoc.id = accPolicyID + DATEFORMATTER.get().format(policyPeriod.PeriodStart)
    gsonDoc.publicId = policyPeriod.PublicID

    gsonDoc.createTime = policyPeriod.CreateTime.toISOTimestamp()
    gsonDoc.updateTime = policyPeriod.UpdateTime.toISOTimestamp()

    if (policyPeriod.IsAEPMasterPolicy_ACC) {
      gsonDoc.accId = accPolicyID
      gsonDoc.accPolicySuffix = null
    } else {
      gsonDoc.accId = accPolicyID.substring(0, 8)
      gsonDoc.accPolicySuffix = accPolicyID.substring(8, 9)
    }

    gsonDoc.status = policyPeriod.PeriodDisplayStatus
    gsonDoc.policyNumber = policyPeriod.PolicyNumber
    gsonDoc.policyStatus = policyPeriod.Status.DisplayName
    gsonDoc.levyYear = policyPeriod.LevyYear_ACC
    gsonDoc.validForClaimsRegistration = policyPeriod.PolicyTerm.ValidForClaimsReg_ACC
    gsonDoc.activeTerm = policyPeriod.PolicyTerm.ActiveTerm_ACC

    gsonDoc.isAepMemberPolicy = isAepMember
    gsonDoc.aepPlanStartDate = policyPeriod.PolicyTerm.AEPPlanStartDate_ACC?.toISODate()
    gsonDoc.aepPlanEndDate = policyPeriod.PolicyTerm.AEPPlanEndDate_ACC?.toISODate()
    gsonDoc.aepAuditCompletionDate = policyPeriod.PolicyTerm.AEPAuditCompletionDate_ACC?.toISODate()
    gsonDoc.aepMidTermStartDate = policyPeriod.PolicyTerm.AEPMidTermStartDate_ACC?.toISODate()

    gsonDoc.effective = policyPeriod.PeriodStart.toISODate()
    gsonDoc.expiration = policyPeriod.EndOfCoverageDate.toISODate()
    gsonDoc.cancellationDate = policyPeriod.CancellationDate?.toISODate()
    gsonDoc.ceasedTradingDate = policyPeriod.PolicyTerm.CeasedTradingDate_ACC?.toISODate()
    gsonDoc.levyCost = policyPeriod.TotalCostRPT
    gsonDoc.totalPremium = policyPeriod.TotalPremiumRPT_amt?:BigDecimal.ZERO
//    gsonDoc.gst = policyPeriod.TaxAndSurchargesRPT

    if (policyPeriod.AEPLineExists) {
      gsonDoc.accreditedEmployerLevy = policyPeriod.AccreditedEmployerLevy_amt
    }

    var policyLineGenerator = new PolicyLineGsonGenerator()

    gsonDoc.policyLines = new HashMap<String, IGSONPolicyLine>()

    if (isAepMember) {
      gsonDoc.aepMasterAccId = policyPeriod.Policy.Account.ACCID_ACC

      // This AEP Policy Line from the AEP contract policy is duplicated here for AEP members for Eos only.
      // This preserved a data structure when migrating Eos from IIB to CosmosDB
      // Eos should pull this data from the AEP master policy instead.
      // To be removed if/when Eos is refactored to use the correct data source.
      var aepMasterPolicyPeriod = entity.AEPMasterPolicy_ACC
          .PolicyTermFinder_ACC
          .findPolicyTermForLevyYear(entity.LevyYear_ACC)
              ?.findLatestBoundOrAuditedPeriod_ACC()
      if (aepMasterPolicyPeriod != null and aepMasterPolicyPeriod.AEPLineExists) {
        var gsonPolicyLine = policyLineGenerator.generate(aepMasterPolicyPeriod.AEPLine, false)
        gsonDoc.policyLines.put("aep", gsonPolicyLine)
      }
    }

    if (policyPeriod.INDCoPLineExists) {
      var gsonPolicyLine = policyLineGenerator.generate(policyPeriod.INDCoPLine)
      gsonDoc.policyLines.put("cp", gsonPolicyLine)
    }
    if (policyPeriod.INDCPXLineExists) {
      var gsonPolicyLine = policyLineGenerator.generate(policyPeriod.INDCPXLine)
      gsonDoc.policyLines.put("cpx", gsonPolicyLine)
    }
    if (policyPeriod.EMPWPCLineExists) {
      var gsonPolicyLine = policyLineGenerator.generate(policyPeriod.EMPWPCLine)
      gsonDoc.policyLines.put("wpc", gsonPolicyLine)
    }
    if (policyPeriod.CWPSLineExists) {
      var gsonPolicyLine = policyLineGenerator.generate(policyPeriod.CWPSLine)
      gsonDoc.policyLines.put("wps", gsonPolicyLine)
    }
    if (policyPeriod.AEPLineExists) {
      var gsonPolicyLine = policyLineGenerator.generate(policyPeriod.AEPLine, true)
      gsonDoc.policyLines.put("aep", gsonPolicyLine)
    }

    if (policyPeriod.IsAEPMasterPolicy_ACC or isAepMember) {
      gsonDoc.policyType = "AEP"
    } else if (policyPeriod.INDCPXLineExists) {
      gsonDoc.policyType = "CPX"
    } else if (policyPeriod.INDCoPLineExists) {
      gsonDoc.policyType = "CP"
    } else if (policyPeriod.EMPWPCLineExists) {
      gsonDoc.policyType = "WPC"
    } else if (policyPeriod.CWPSLineExists) {
      gsonDoc.policyType = "WPS"
    }

    gsonDoc.pcServerId = ServerUtil.ServerId
    gsonDoc.pcEventTime = new Date().toISOTimestamp()

    return gsonDoc
  }

}