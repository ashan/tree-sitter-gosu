package nz.co.acc.plm.integration.ir.exec.handler.actions.customerupdate

uses entity.BusinessIndustryCode_ACC
uses gw.api.database.Query
uses gw.pl.persistence.core.Bundle

uses nz.co.acc.integration.instruction.helper.InstructionRecordUtil
uses nz.co.acc.integration.ir.record.CREGRecord
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.IRAccountHelper
uses nz.co.acc.plm.integration.validation.nzbnvalidation.MBIEAPIClient
uses nz.co.acc.plm.util.ActivityUtil
uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Actions that a CustomerUpdate can perform - create account & policy.
 * <p>
 * Created by Swati Patel on 12/04/2017.
 */
class CustomerUpdateActions {
  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  // handles account actions
  private var _accountActions : CustomerUpdateAccountActions
  // handles policy actions
  private var _policyActions : CustomerUpdatePolicyActions
  // The account to create the policy on
  private var _account : Account
  // The acc number to create the account and policy for
  private var _accNumber : String
  private var _policyLineType : typekey.PolicyLine
  private var _bicCode : BusinessIndustryCode_ACC
  private var _natureOfBusiness : String
  private var _address : String
  private var _isNewPolicy : boolean
  private var _inboundRecordPublicID : String

  /**
   * CustomerUpdateActions
   *
   * @param customerUpdateData - customer update data fields
   */
  construct(customerUpdateData : CREGRecord) {
    this(customerUpdateData, new MBIEAPIClient())
  }

  /**
   * CustomerUpdateActions
   *
   * @param customerUpdateData - customer update data fields
   */
  construct(customerUpdateData : CREGRecord, mbieClient : MBIEAPIClient) {
    _inboundRecordPublicID = customerUpdateData.InboundRecordPublicID
    _accNumber = customerUpdateData.AccNumber
    _natureOfBusiness = customerUpdateData.NatureOfBusiness
    _policyActions = new CustomerUpdatePolicyActions(customerUpdateData.AccNumber, customerUpdateData.EntityType,
        customerUpdateData.EmployerClassification, customerUpdateData.DateOfBirth)
    _policyLineType = _policyActions.PolicyLineType
    _accountActions = new CustomerUpdateAccountActions(_policyLineType, customerUpdateData, mbieClient)
  }

  function createAccountAndPolicy(bundle : Bundle) : Account {
    createAccount(bundle)
    createPolicy(bundle)
    return _account
  }

  /**
   * Create/update account based on the customer update data set by constructor.
   * If the account number/ACCID already exists then the account will be updated.  If not it will be created.
   *
   * @param bundle - the bundle to use.
   * @return - the account created
   */
  public function createAccount(bundle : Bundle) : Account {
    var result = ActionsUtil.getAccountByAccNumber(_accNumber)

    if (result != null) {
      _account = _accountActions.updateAccount(result, bundle)
    } else {
      _account = _accountActions.createAccount(bundle)
    }
    _address = _accountActions.getAddressLinesForBICLookup()
    return _account
  }

  /**
   * Create policy (if required).
   * Assumes account has been created or updated and is in the bundle.
   *
   * @param bundle - the bundle to use.
   */
  public function createPolicy(bundle : Bundle) {
    var policyStartDate = ActionsUtil.calculatePolicyStartDate()
    createPolicy(bundle, policyStartDate)
  }

  /**
   * Create policy (if required).
   * Assumes account has been created or updated and is in the bundle.
   *
   * @param bundle - the bundle to use.
   */
  public function createPolicy(bundle : Bundle, policyStartDate : Date) {
    _log.info("createPolicy for account ${_account.ACCID_ACC} with policyStartDate ${policyStartDate.toISODate()}")
    var policyPeriod = new IRAccountHelper(_account).findLatestPolicyPeriod(_policyLineType)
    _isNewPolicy = policyPeriod == null

    var customerUpdateBicAPI = new CustomerUpdateBusinessClassificationAPI()

    if (_isNewPolicy) {
      _bicCode = customerUpdateBicAPI.bicCodeLookupForNewPolicy(
          _account, policyStartDate, _natureOfBusiness, _address)
    } else {
      _bicCode = customerUpdateBicAPI.bicCodeLookupForExistingPolicy(
          _account, policyStartDate, _natureOfBusiness, _policyLineType, _inboundRecordPublicID)
    }

    if (_isNewPolicy) {
      _policyActions.createPolicy(_bicCode, bundle, policyStartDate)
      if (customerUpdateBicAPI.isDefaultBICApplied()) {
        ActivityUtil.createCUReviewActivity(_account)
      }
    } else {
      //Policy could exist, but the employer classification could have changed
      _policyActions.updateEmployerClassificationIfRequired(policyPeriod.Policy, bundle)
      // The BIC code is different, we need to do a policy change.
      if (_bicCode != null) {
        // The BIC code is different, we need to do a policy change.
        processCUChange(bundle, _accNumber, policyPeriod.Policy.ProductCode, _bicCode.BusinessIndustryCode)
      }
    }
  }

  private function processCUChange(
      bundle : Bundle,
      accID : String,
      productCode : String,
      bicCode : String) {
    _log.info("CUChange for ${accID}:${productCode} to ${bicCode}")
    var currentLevyYear = DateUtil_ACC.getCurrentLevyYear()
    var orderedLYList = Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Equals, _accNumber)
        .compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
        .compare(PolicyTerm#AEPFinancialYear_ACC, GreaterThanOrEquals, currentLevyYear)
        .select().map(\elt -> elt.AEPFinancialYear_ACC).toSet().order()

    if (orderedLYList.Empty) {
      _log.info("processCUChange: policyTerms not found for accID=${_accNumber}, productCode=${productCode}")
      return
    }
    _log.info("CUChange for ${accID}:${productCode} to ${bicCode}. Found ${orderedLYList.Count} policyTerms to update")
    orderedLYList.each(\elt -> {
      createCUChangeRecord(bundle, accID, productCode, elt, bicCode)
    })
  }

  function createCUChangeRecord(bundle : Bundle, accID : String, productCode : String, levyYear : Integer, bicCode : String) {
    var record = InstructionRecordUtil.createCUChangeInstructionRecordEntity(
        bundle,
        accID,
        productCode,
        levyYear,
        bicCode,
        InstructionSource_ACC.TC_IR)
    _log.info("Created ${record}")
  }
}
