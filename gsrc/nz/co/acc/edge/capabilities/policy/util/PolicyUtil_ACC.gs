package nz.co.acc.edge.capabilities.policy.util

uses edge.capabilities.policy.auth.IPolicyAccessPlugin
uses edge.capabilities.policy.util.PolicyUtil
uses edge.jsonrpc.exception.JsonRpcInvalidRequestException
uses edge.security.authorization.exception.NoAuthorityException
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.webservice.exception.BadIdentifierException
uses nz.co.acc.lob.common.DateUtil_ACC
uses typekey.Job
uses gw.pl.persistence.core.Bundle

/**
 * Created by nitesh.gautam on 22-May-17.
 */
class PolicyUtil_ACC {

  /**
   * throws exception if another policy change is already in progress
   *
   * @param policyPeriod
   * @author nitesh.gautam
   */
  public static function isPolicyChangeInProgress(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Job typeis PolicyChange and !policyPeriod.Job.Complete) {
      throw new JsonRpcInvalidRequestException() {:Message = DisplayKey.get("Edge.Capabilities.Helpers.Exception.CannotExecuteUpdateRequestAsUpdateIsAlreadyInProgress")}
    }
  }

  /**
   * throws exception if another policy change is already in progress
   *
   * @param policyPeriod
   * @author nitesh.gautam
   */
  public static function isAuditInProgress(policyPeriod : PolicyPeriod) {
    if (policyPeriod.Job typeis Audit and !policyPeriod.Job.Complete) {
      throw new JsonRpcInvalidRequestException() {:Message = DisplayKey.get("Edge.Capabilities.Helpers.Exception.CannotExecuteUpdateRequestAsUpdateIsAlreadyInProgress")}
    }
  }

  static function getLatestPolicyPeriodByPolicyNumber(policyNumber : String, _policyAccessPlugin : IPolicyAccessPlugin) : PolicyPeriod {
    var policyPeriod = PolicyUtil.getLatestPolicyPeriodByPolicyNumber(policyNumber)

    if (!_policyAccessPlugin.hasAccess(policyPeriod)) {
      throw new NoAuthorityException()
    }

    if (policyPeriod == null) {
      throw new BadIdentifierException("Can not find currently active policy period for " + policyNumber)
    }

    return policyPeriod
  }

  static function findPolicyByPolicyNumber(policyNumber : String, _policyAccessPlugin : IPolicyAccessPlugin) : Policy {
    var policy = Policy.finder.findPolicyByPolicyNumber(policyNumber)

    if (!_policyAccessPlugin.hasAccess(policy)) {
      throw new NoAuthorityException()
    }

    if (policy == null) {
      throw new BadIdentifierException(DisplayKey.get("Edge.Capabilities.Helpers.Exception.BadPolicyNumber", policyNumber))
    }

    return policy
  }

  static function getProductPolicyType(productCode : String) : AddressPolicyType_ACC {
    if (productCode == "IndividualACC") {
      return AddressPolicyType_ACC.TC_CPCPX
    } else if (productCode == "EmployerACC") {
      return AddressPolicyType_ACC.TC_WPC
    } else if (productCode == "ShareholdingCompany") {
      return AddressPolicyType_ACC.TC_WPS
    }
    return null
  }

  public static function getMostRecentPeriodByLevyYear_ACC(policyNumber : String, levyYear : Integer) : PolicyPeriod {
    var query = Query.make(PolicyPeriod)
    query.compare(PolicyPeriod#PolicyNumber, Relop.Equals, policyNumber)
    return processQuery(query, levyYear)
  }

  public static function findMostRecentPeriodByACCPolicyIDAndLevyYear_ACC(accPolicyID_ACC : String, levyYear : Integer) : PolicyPeriod {
    var query = Query.make(PolicyPeriod)
    query.compare(PolicyPeriod#ACCPolicyID_ACC, Relop.Equals, accPolicyID_ACC)
    return processQuery(query, levyYear)
  }

  private static function processQuery(query : Query<PolicyPeriod>, levyYear : Integer) : PolicyPeriod {
    query.compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, levyYear)

    if (levyYear <= DateUtil_ACC.getCurrentLevyYear()) {
      query.compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
    } else {
      query.compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTED, PolicyPeriodStatus.TC_RENEWING})
    }

    var period = query.select()
        .toList()
        .orderByDescending(\pp -> pp.Job.CloseDate)
        .first()

    return period?.getSliceAtEffectiveDate_ACC()
  }

  /**
   * Checks if a policy change can be started or modified for the given policy.
   *
   * @see DefaultPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String) for an explanation on the
   * conditions checked by this method.
   */
  @Param("policy", "The target policy")
  @Returns("'null' if a policy change can be started or modified. An error message otherwise")
  static function checkPolicyChangeCanBeStarted(policyPeriod : PolicyPeriod) : String {
    var latestPeriod = getMostRecentPeriodByLevyYear_ACC(policyPeriod.PolicyNumber, policyPeriod.LevyYear_ACC)
    var policy = latestPeriod.Policy
    if (latestPeriod.Canceled) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnCancelledPolicy")
    }

    if (policy.RewrittenToNewAccountDestination != null) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnRewrittenPolicy")
    }

    if (!policy.Issued) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnNotIssuedPolicy")
    }

    var hasPending = hasPendingTransactions(policyPeriod)

    if (hasPending.Count > 1) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.OutOfSequence")
    }

    return null
  }

  /**
   * Checks if a policy change can be started or modified for the given policy.
   *
   * @see DefaultPolicyChangeRetrievalPlugin#retrieveByPolicyNumber(String) for an explanation on the
   * conditions checked by this method.
   */
  @Param("policy", "The target policy")
  @Returns("'null' if a policy change can be started or modified. An error message otherwise")
  static function checkNewTransactionCanBeStarted(policyPeriod : PolicyPeriod) : String {
    var latestPeriod = getMostRecentPeriodByLevyYear_ACC(policyPeriod.PolicyNumber, policyPeriod.LevyYear_ACC)
    var policy = latestPeriod.Policy
    if (latestPeriod.Canceled) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyUtil.NoNewTransactionOnCancelledPolicy_ACC")
    }

    if (policy.RewrittenToNewAccountDestination != null) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyUtil.NoNewTransactionOnRewrittenPolicy_ACC")
    }

    if (!policy.Issued) {
      return DisplayKey.get("Edge.Capabilities.PolicyChange.Util.PolicyChangeUtil.NoPolicyChangeOnNotIssuedPolicy")
    }

    var hasPending = hasPendingTransactions(policyPeriod)

    if (hasPending.Count > 0) {
      return DisplayKey.get("Edge.Capabilities.Audit.Util.PolicyUtil.UnboundTransactionExist_ACC")
    }

    return null
  }

  private static function hasPendingTransactions(policyPeriod : PolicyPeriod) : List<PolicyPeriod> {
    var ppQuery = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#PolicyNumber, Relop.Equals, policyPeriod.PolicyNumber)
        .compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, policyPeriod.LevyYear_ACC)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_DRAFT, PolicyPeriodStatus.TC_QUOTED})
    return ppQuery.select().toList()
  }

  /**
   * returns retrieve all the transaction by status
   *
   * @param policyNumber       the policy number
   * @param levyYear           the levy year
   * @param policyperiodStatus the levy year
   * @return the policy details for the levy year
   */
  public static function getTransactionByStatus(policyNumber : String, levyYear : int, policyperiodStatus : PolicyPeriodStatus[]) : List<PolicyPeriod> {
    var ppQuery = Query.make(PolicyPeriod)
        .compare(PolicyPeriod#PolicyNumber, Relop.Equals, policyNumber)
        .compare(PolicyPeriod#LevyYear_ACC, Relop.Equals, levyYear)
        .compareIn(PolicyPeriod#Status, policyperiodStatus)
    ppQuery.join(PolicyPeriod#Job).compare(entity.Job#JobNumber, Relop.NotEquals, null)
    return ppQuery.select().toList()
  }

  public static function hasPendingRenewing(accPolicyID : String) : Boolean {
    var ppQuery = Query.make(PolicyPeriod)
    ppQuery.compare(PolicyPeriod#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
    ppQuery.compare(PolicyPeriod#Status, Relop.Equals, PolicyPeriodStatus.TC_RENEWING)
    var jobQuery = ppQuery.join(PolicyPeriod#Job)
    jobQuery.compare(entity.Job#Subtype, Relop.Equals, Job.TC_RENEWAL)
    return ppQuery.select().HasElements
  }

  public static function updatePolicyAddressIfNotInSync(period : PolicyPeriod, bundle : Bundle) {
    var policyAddress = period.PolicyAddress
    var PNIContact = period.PNIContactDenorm
    if (!policyAddress.Address.Retired and PNIContact.PrimaryAddress != policyAddress.Address) {
      bundle.add(period)
      period.editIfRatedOrQuoted()
      bundle.add(policyAddress)
      period.changePolicyAddressTo(PNIContact.PrimaryAddress)
    }
  }
}