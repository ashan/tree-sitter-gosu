package nz.co.acc.sampledata


uses gw.api.builder.UWAuthorityProfileBuilder
uses gw.bizrules.provisioning.contexts.AuditOnHoldContextDefinition_ACC
uses gw.bizrules.provisioning.contexts.ReassessmentContextDefinition_ACC
uses gw.pl.persistence.core.Bundle
uses gw.sampledata.AbstractSampleDataCollection

@Export
class UWAuthorityData_ACC  {

  private var _underwriter1 : UWAuthorityProfile as readonly Underwriter1
  private var _underwriter2 : UWAuthorityProfile as readonly Underwriter2
  private var _underwriterManager : UWAuthorityProfile as readonly UnderwriterManager
  private var _underwriterForReassessment : UWAuthorityProfile as readonly UnderwriterForReassessment
  private var _dfa1_ACC : UWAuthorityProfile as readonly Dfa1_ACC
  private var _dfa2_ACC : UWAuthorityProfile as readonly Dfa2_ACC
  private var _dfa3_ACC : UWAuthorityProfile as readonly Dfa3_ACC
  private var _dfa4_ACC : UWAuthorityProfile as readonly Dfa4_ACC
  private var _dfa5_ACC : UWAuthorityProfile as readonly Dfa5_ACC
  private var _dfa6_ACC : UWAuthorityProfile as readonly Dfa6_ACC
  private var _dfa7_ACC : UWAuthorityProfile as readonly Dfa7_ACC
  private var _dfa8_ACC : UWAuthorityProfile as readonly Dfa8_ACC
  private var _dfa9_ACC : UWAuthorityProfile as readonly Dfa9_ACC
  private var _dfa10_ACC : UWAuthorityProfile as readonly Dfa10_ACC
  private var _dfa11_ACC : UWAuthorityProfile as readonly Dfa11_ACC
  private var _dfa12_ACC : UWAuthorityProfile as readonly Dfa12_ACC
  private var _dfa13_ACC : UWAuthorityProfile as readonly Dfa13_ACC

  private var _auditDfa1_ACC : UWAuthorityProfile as readonly AuditDfa1_ACC
  private var _auditDfa2_ACC : UWAuthorityProfile as readonly AuditDfa2_ACC
  private var _auditDfa3_ACC : UWAuthorityProfile as readonly AuditDfa3_ACC
  private var _auditDfa4_ACC : UWAuthorityProfile as readonly AuditDfa4_ACC
  private var _auditDfa5_ACC : UWAuthorityProfile as readonly AuditDfa5_ACC
  private var _auditDfa6_ACC : UWAuthorityProfile as readonly AuditDfa6_ACC
  private var _auditDfa7_ACC : UWAuthorityProfile as readonly AuditDfa7_ACC
  private var _auditDfa8_ACC : UWAuthorityProfile as readonly AuditDfa8_ACC
  private var _auditDfa9_ACC : UWAuthorityProfile as readonly AuditDfa9_ACC
  private var _auditDfa10_ACC : UWAuthorityProfile as readonly AuditDfa10_ACC
  private var _auditDfa11_ACC : UWAuthorityProfile as readonly AuditDfa11_ACC
  private var _auditDfa12_ACC : UWAuthorityProfile as readonly AuditDfa12_ACC
  private var _auditDfa13_ACC : UWAuthorityProfile as readonly AuditDfa13_ACC

  function loadUWAuthorityData(bundle : Bundle) : UWAuthorityData_ACC {
    _underwriter1 = new UWAuthorityProfileBuilder()
        .withName("Underwriter 1")
        .withDescription("Underwriter Level 1")
        .withGrant("AgreedLevelOfCover_LE_ACC", true, null)
        .create(bundle)

    _underwriter2 = new UWAuthorityProfileBuilder()
        .withName("Underwriter 3")
        .withDescription("Underwriter Level 3")
        .withGrant("AgreedLevelOfCover_GT_ACC", true, null)
        .create(bundle)
        .inheritGrantsFrom(Underwriter1)

    _underwriterManager = new UWAuthorityProfileBuilder()
        .withName("Underwriter Manager")
        .withGrant("UW1ReviewBlocksQuoteRelease", false, null)
        .withGrant("UW2ReviewBlocksQuoteRelease", false, null)
        .withGrant("UWManagerReviewBlocksQuoteRelease", false, null)
        .create(bundle)
        .inheritGrantsFrom(Underwriter2)

    _underwriterForReassessment = new UWAuthorityProfileBuilder()
        .withName("Reassessment Manager")
        .withDescription("Can Approve a migrated policy that is on hold")
        .withGrant(ReassessmentContextDefinition_ACC.CODE_PREVENT_REASSESSMENT, false, null)
        .withGrant(AuditOnHoldContextDefinition_ACC.AUDIT_ON_HOLD_PREVENT_REASSESSMENT, false, null)
        .create(bundle)
        
    _dfa13_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 0")
        .withDescription("Delegated Financial Authority Limits - 0")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "0")
        .create(bundle)

    _dfa12_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 1000")
        .withDescription("Delegated Financial Authority Limits - 1000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "1000")
        .create(bundle)

    _dfa11_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 2500")
        .withDescription("Delegated Financial Authority Limits - 2500")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "2500")
        .create(bundle)

    _dfa10_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 5000")
        .withDescription("Delegated Financial Authority Limits - 5000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "5000")
        .create(bundle)

    _dfa9_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 10000")
        .withDescription("Delegated Financial Authority Limits - 10000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "10000")
        .create(bundle)

    _dfa8_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 15000")
        .withDescription("Delegated Financial Authority Limits - 15000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "15000")
        .create(bundle)

    _dfa7_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 19999")
        .withDescription("Delegated Financial Authority Limits - 19999")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "19999")
        .create(bundle)

    _dfa6_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 25000")
        .withDescription("Delegated Financial Authority Limits - 25000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "25000")
        .create(bundle)

    _dfa5_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 50000")
        .withDescription("Delegated Financial Authority Limits - 50000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "50000")
        .create(bundle)

    _dfa4_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 150000")
        .withDescription("Delegated Financial Authority Limits - 150000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "150000")
        .create(bundle)

    _dfa3_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 250000")
        .withDescription("Delegated Financial Authority Limits - 250000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "250000")
        .create(bundle)

    _dfa2_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 500000")
        .withDescription("Delegated Financial Authority Limits - 500000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "500000")
        .create(bundle)

    _dfa1_ACC = new UWAuthorityProfileBuilder()
        .withName("Delegated Financial Authority Limits - 1000000")
        .withDescription("Delegated Financial Authority Limits - 1000000")
        .withGrant("DelegatedFinancialAuthorityLimits_ACC", false, "1000000")
        .create(bundle)

    _auditDfa13_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 0")
        .withDescription("Audit Delegated Financial Authority Limits - 0")
        .withGrant("FinalAuditDFALimits_ACC", false, "0")
        .create(bundle)

    _auditDfa12_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 1000")
        .withDescription("Audit Delegated Financial Authority Limits - 1000")
        .withGrant("FinalAuditDFALimits_ACC", false, "1000")
        .create(bundle)

    _auditDfa11_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 2500")
        .withDescription("Audit Delegated Financial Authority Limits - 2500")
        .withGrant("FinalAuditDFALimits_ACC", false, "2500")
        .create(bundle)

    _auditDfa10_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 5000")
        .withDescription("Audit Delegated Financial Authority Limits - 5000")
        .withGrant("FinalAuditDFALimits_ACC", false, "5000")
        .create(bundle)

    _auditDfa9_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 10000")
        .withDescription("Audit Delegated Financial Authority Limits - 10000")
        .withGrant("FinalAuditDFALimits_ACC", false, "10000")
        .create(bundle)

    _auditDfa8_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 15000")
        .withDescription("Audit Delegated Financial Authority Limits - 15000")
        .withGrant("FinalAuditDFALimits_ACC", false, "15000")
        .create(bundle)

    _auditDfa7_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 19999")
        .withDescription("Audit Delegated Financial Authority Limits - 19999")
        .withGrant("FinalAuditDFALimits_ACC", false, "19999")
        .create(bundle)

    _auditDfa6_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 25000")
        .withDescription("Audit Delegated Financial Authority Limits - 25000")
        .withGrant("FinalAuditDFALimits_ACC", false, "25000")
        .create(bundle)

    _auditDfa5_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 50000")
        .withDescription("Audit Delegated Financial Authority Limits - 50000")
        .withGrant("FinalAuditDFALimits_ACC", false, "50000")
        .create(bundle)

    _auditDfa4_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 150000")
        .withDescription("Audit Delegated Financial Authority Limits - 150000")
        .withGrant("FinalAuditDFALimits_ACC", false, "150000")
        .create(bundle)

    _auditDfa3_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 250000")
        .withDescription("Audit Delegated Financial Authority Limits - 250000")
        .withGrant("FinalAuditDFALimits_ACC", false, "250000")
        .create(bundle)

    _auditDfa2_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 500000")
        .withDescription("Audit Delegated Financial Authority Limits - 500000")
        .withGrant("FinalAuditDFALimits_ACC", false, "500000")
        .create(bundle)

    _auditDfa1_ACC = new UWAuthorityProfileBuilder()
        .withName("Audit Delegated Financial Authority Limits - 1000000")
        .withDescription("Audit Delegated Financial Authority Limits - 1000000")
        .withGrant("FinalAuditDFALimits_ACC", false, "1000000")
        .create(bundle)
    return this
  }

}
