package nz.co.acc.integration.ir.workqueue

uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.constants.ProductCode
uses nz.co.acc.plm.integration.ir.exec.handler.actions.customerupdate.CustomerUpdatePolicyActions
uses nz.co.acc.plm.common.bic.BusinessClassificationAPI
uses gw.api.database.Query
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil

class IREmployerPolicyUtil {
  private static var _log = StructuredLogger.INTEGRATION.withClass(IREmployerPolicyUtil)

  function createEmployerPolicy(accID : String) {
    var account = Query.make(Account).compare(Account#ACCID_ACC, Relop.Equals, accID).select().first()
    createEmployerPolicy(account)
  }

  private function createEmployerPolicy(account : Account) {
    // Try to find Shareholding Company policy, else Individual
    var latestPolicyPeriod = findLatestWPSPeriod(account)
    if (latestPolicyPeriod != null) {
      final var businessIndustryCode = latestPolicyPeriod.CWPSLine.BICCodes.firstWhere(\bicCode -> bicCode.isPrimary())
      final var entityType = "C"
      createEmployerPolicy(account, businessIndustryCode, entityType, null)
      return
    }

    latestPolicyPeriod = findLatestCPPeriod(account)
    if (latestPolicyPeriod != null) {
      final var businessIndustryCode = latestPolicyPeriod.INDCoPLine.BICCodes.first()
      final var entityType = "I"
      final var dob = account.AccountHolder.AccountContact.Contact.Person.DateOfBirth
      createEmployerPolicy(account, businessIndustryCode, entityType, dob)
      return
    }

    _log.info("Account ${account.ACCID_ACC} does not have an existing CP/WPS Policy")
  }

  private function findLatestWPSPeriod(account : Account) : PolicyPeriod {
    return account.Policies
        ?.where(\pol -> pol.ProductCode_ACC == ProductCode.ShareholdingCompany)
        ?.sortByDescending(\p -> p.CreateTime)
        ?.first()
        ?.PolicyTermFinder_ACC
        ?.findLatestPolicyTerm()
        ?.findLatestBoundOrAuditedPeriod_ACC()
  }

  private function findLatestCPPeriod(account : Account) : PolicyPeriod {
    return account.Policies
        ?.where(\pol -> pol.ProductCode_ACC == ProductCode.IndividualACC)
        ?.sortByDescending(\p -> p.CreateTime)
        ?.first()
        ?.PolicyTermFinder_ACC
        ?.findLatestPolicyTerm()
        ?.findLatestBoundOrAuditedPeriod_ACC()
  }

  private function createEmployerPolicy(
      account : Account,
      businessIndustryCode : PolicyLineBusinessClassificationUnit_ACC,
      entityType : String,
      dob : Date) {

    _log.info("Creating WPC policy on account ${account.ACCID_ACC}")
    final var policyStartDate = ActionsUtil.calculatePolicyStartDate()

    var bicCode = Query.make(BusinessIndustryCode_ACC)
        .compare(BusinessIndustryCode_ACC#BusinessIndustryCode, Relop.Equals, businessIndustryCode.BICCode)
        .compare(BusinessIndustryCode_ACC#StartDate, Relop.Equals, policyStartDate)
        .select().first()

    // use CU Code to get BIC Code if latest CP/WPS does not have BIC Code
    if (bicCode == null) {
      bicCode = Query.make(BusinessIndustryCode_ACC)
          .join(BusinessIndustryCode_ACC#ClassificationUnit_ACC)
          .compare(ClassificationUnit_ACC#ClassificationUnitCode, Relop.Equals, businessIndustryCode.CUCode)
          .compare(ClassificationUnit_ACC#StartDate, Relop.Equals, policyStartDate)
          .select()
          .first()

      // default BIC Code based on parameter script and address
      if (bicCode == null) {
        var primaryAddress = account.AccountHolderContact.PrimaryAddress
        var address = primaryAddress.AddressLine1 + " " + primaryAddress.AddressLine2
        var levyYear = policyStartDate.YearOfDate + 1
        bicCode = new BusinessClassificationAPI().getBICCodeFromAddress(address, levyYear)
      }
    }

    final var employerClassification = "O"
    final var policyActions = new CustomerUpdatePolicyActions(account.ACCID_ACC, entityType, employerClassification, dob)

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\b -> {
      b.add(account)
      policyActions.createPolicy(bicCode, b, policyStartDate)
      updateAddressFlags(account, b)
    })
  }

  private function updateAddressFlags(account : Account, bundle : Bundle) {
    var primaryContact = account.PrimaryContact_ACC
    if (primaryContact.WPCAddress_ACC == null) {
      var primaryAddress = primaryContact.PrimaryAddress
      if (primaryAddress != null) {
        _log.info("Setting WPC Address for primary contact on ${account.ACCID_ACC}")
        primaryAddress = bundle.add(primaryAddress)
        primaryContact = bundle.add(primaryContact)
        primaryAddress.IsWPCAddress_ACC = true
        primaryContact.WPCAddress_ACC = primaryAddress
      }
    }
  }

}