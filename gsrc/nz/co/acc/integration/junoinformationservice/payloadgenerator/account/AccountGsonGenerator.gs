package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.system.server.ServerUtil
uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccount
uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccountUserRoleAssignment
uses nz.co.acc.integration.junoinformationservice.model.account.GSONMaoriBusinessInfo
uses nz.co.acc.integration.junoinformationservice.model.account.GSONRelatedAccount
uses nz.co.acc.integration.junoinformationservice.model.policy.GSONPolicy
uses nz.co.acc.integration.junoinformationservice.payloadgenerator.policy.AEPAccountComplianceGsonGenerator
uses nz.co.acc.integration.junoinformationservice.payloadgenerator.policy.PolicyTermGsonGenerator
uses nz.co.acc.plm.integration.ir.util.ConstantPropertyHelper

/**
 * Payload generator for the Account entity.
 */
class AccountGsonGenerator {

  function generate(entity : Account) : GSONAccount {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONAccount()

//    gsonDoc.id = PayloadUtil.normalizeID(entity.ACCID_ACC)
    gsonDoc.id = entity.ACCID_ACC
    gsonDoc.balanceDate = entity?.BalanceDate_ACC?.toISOTimestamp()
    gsonDoc.accId = entity.ACCID_ACC
    gsonDoc.accountName = entity.AccountHolderContact.DisplayName
    gsonDoc.accountType = entity.AccountHolderContact.Subtype.Code
    gsonDoc.accountNumber = entity.AccountNumber
    gsonDoc.irdNumber = entity.IRDNumberDerived_ACC
    gsonDoc.nzbn = entity.NZBN_ACC
    gsonDoc.tradingName = entity.TradingName_ACC
    gsonDoc.myAccRegistrationStatus = entity.MyA4BRegistrationStatus_ACC.Code

    gsonDoc.isAepContractAccount = entity.AEPContractAccount_ACC ? true : false

    gsonDoc.organizationType = entity.AccountOrgType.Code

    gsonDoc.status = entity.StatusOfAccount_ACC.Code

    gsonDoc.userRoleAssignments = generateAccountUserRoleAssignments(entity)

    gsonDoc.maoriBusinessInfo = generateAccountsMaoriBusinessIdentifiers(entity)

    var acpg = new AccountContactGsonGenerator()
    gsonDoc.accountContacts = entity.AccountContacts.fastList()
        .where(\accountContact -> !isShareholderOnly(accountContact))
        .map(\accountContact -> acpg.generate(accountContact))

    gsonDoc.relatedAccounts = new ArrayList<GSONRelatedAccount>()
    var relatedAccounts = entity.getAllRelatedAccounts(User.util.UnrestrictedUser)
    relatedAccounts.each(\accountAccount ->
        gsonDoc.relatedAccounts.add(getGsonRelatedAccount(entity, accountAccount)))

    var wpcPeriod = findLatestPolicyPeriod(entity.ACCID_ACC, ConstantPropertyHelper.PRODUCTCODE_WPC)
    var wpsPeriod = findLatestPolicyPeriod(entity.ACCID_ACC, ConstantPropertyHelper.PRODUCTCODE_WPS)
    var cpPeriod = findLatestPolicyPeriod(entity.ACCID_ACC, ConstantPropertyHelper.PRODUCTCODE_CP)

    gsonDoc.policies = new ArrayList<GSONPolicy>()
    wpcPeriod.each(\policyPeriod -> gsonDoc.policies.add(getGsonPolicy(policyPeriod)))
    wpsPeriod.each(\policyPeriod -> gsonDoc.policies.add(getGsonPolicy(policyPeriod)))
    cpPeriod.each(\policyPeriod -> gsonDoc.policies.add(getGsonPolicy(policyPeriod)))

    if (entity.AEPContractAccount_ACC) {
      gsonDoc.aepContractNumber = entity.AEPContractNumber_ACC
      gsonDoc.aepAgreementSignedDate = entity.AEPAgreementOrigSignedDate_ACC?.toISODate()
      gsonDoc.aepTpaAgreement = entity.AEPTPAAgreement_ACC?.Code
      gsonDoc.aepTpaNature = entity.AEPTPANature_ACC?.Code

      var aepPeriod = Optional.ofNullable(entity.AEPMasterPolicy_ACC
          ?.PolicyTermFinder_ACC
          ?.findMostRecentPolicyTerm()
          ?.findLatestBoundOrAuditedPeriod_ACC())
      aepPeriod.each(\policyPeriod -> gsonDoc.policies.add(getGsonPolicy(policyPeriod)))


      var acdg = new AEPAccountComplianceGsonGenerator()
      gsonDoc.aepComplianceDetails = entity.AEPAccountComplianceDetails.fastList()
          .map(\complianceDetails -> acdg.generate(complianceDetails))

      gsonDoc.aepMemberPolicies = new ArrayList<GSONPolicy>()

      for (policy in entity.Policies) {
        if (policy.IsAEPMemberPolicy_ACC) {
          var policyTerm = policy.PolicyTermFinder_ACC.findPolicyTermForLevyYear(currentLevyYear())
          if (policyTerm != null) {
            var policyPeriod = policyTerm.findLatestBoundOrAuditedPeriod_ACC()
            if (policyPeriod != null) {
              gsonDoc.aepMemberPolicies.add(getGsonPolicy(policyPeriod))
            }
          }
        }
      }
    }

    gsonDoc.pcServerId = ServerUtil.ServerId
    gsonDoc.pcEventTime = new Date().toISOTimestamp()

    return gsonDoc
  }

  // visible for testing
  function currentLevyYear() : Integer {
    return Date.Today.LevyYear_ACC
  }

  // Excluding large numbers of shareholder contacts that break integration with oversized payloads
  private function isShareholderOnly(accountContact : entity.AccountContact) : Boolean {
    return accountContact.Roles.Count == 1
        and accountContact.Roles[0].Subtype == typekey.AccountContactRole.TC_SHAREHOLDERCONTACT_ACC
  }

  private function getGsonRelatedAccount(
      account : Account, accountAccount : AccountAccount) : GSONRelatedAccount {
    var gson = new GSONRelatedAccount()
    var relationship = accountAccount.getRelationship(account)
    var otherAccount = relationship.OtherAccount
    gson.targetAccount = otherAccount.ACCID_ACC
    gson.relationship = relationship.RelationshipType.Description
    gson.effectiveDate = relationship.EffectiveDateFrom_ACC?.toISODate()
    gson.name = otherAccount.AccountHolderContact.DisplayName
    gson.address = otherAccount.AccountHolderContact.PrimaryAddressDisplayValue
    return gson
  }

  private function getGsonPolicy(policyPeriod : PolicyPeriod) : GSONPolicy {
    var gsonPolicyTerm = new PolicyTermGsonGenerator().generate(policyPeriod)

    // null out unnnecessary fields
    gsonPolicyTerm.pcEventTime = null
    gsonPolicyTerm.pcServerId = null

    var policy = policyPeriod.Policy

    var gsonPolicy = new GSONPolicy()
    gsonPolicy.publicId = policy.PublicID
    gsonPolicy.issueDate = policy.IssueDate?.toISODate()
    gsonPolicy.updateTime = policy.UpdateTime.toISOTimestamp()
    gsonPolicy.validForClaimsRegistration = policy.IsValidForClaims_ACC
    gsonPolicy.legacyEmployerId = policy.ClientID_ACC
    gsonPolicy.legacyEmployerId2 = policy.IPS2EmployerID_ACC

    gsonPolicy.policyTerm = gsonPolicyTerm
    gsonPolicy.policyType = gsonPolicyTerm.policyType

    return gsonPolicy
  }

  // TODO: how does this handle prerenewals?
  public function findLatestPolicyPeriod(accID : String, productCode : String) : Optional<PolicyPeriod> {
    var query = Query.make(PolicyTerm)
    query.compare(PolicyTerm#AEPACCNumber_ACC, Equals, accID)
    query.compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
    query.compare(PolicyTerm#MostRecentTerm, Equals, true)

    var orderByLevyYear = QuerySelectColumns.path(Paths.make(PolicyTerm#AEPFinancialYear_ACC))
    var orderByCreateTime = QuerySelectColumns.path(Paths.make(PolicyTerm#CreateTime))

    var mostRecentPolicyTerm = query.select()
        .orderByDescending(orderByLevyYear)
        .thenByDescending(orderByCreateTime)
        .FirstResult

    if (mostRecentPolicyTerm != null) {
      return Optional.of(mostRecentPolicyTerm.findLatestBoundOrAuditedPeriod_ACC())
    } else {
      return Optional.empty()
    }
  }

  private function generateAccountUserRoleAssignments(entity : Account) : List<GSONAccountUserRoleAssignment> {
    var aurapg = new AccountUserRoleAssignmentGsonGenerator()
    return entity.RoleAssignments.fastList().map(\elt -> aurapg.generate(elt))
  }

  private function generateAccountsMaoriBusinessIdentifiers(entity : Account) : GSONMaoriBusinessInfo {
    if (entity.MaoriBusinessInfo != null) {
      var generator = new MaoriBusinessInfoGsonGenerator()
      return generator.generate(entity.MaoriBusinessInfo)
    }
    return null
  }

}
