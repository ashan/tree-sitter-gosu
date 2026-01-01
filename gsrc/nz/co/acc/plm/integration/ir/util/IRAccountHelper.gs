package nz.co.acc.plm.integration.ir.util

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths
uses gw.api.util.DateUtil
uses gw.pl.persistence.core.Bundle
uses typekey.PolicyLine

/**
 * Common methods created for Accounts...
 */
class IRAccountHelper {

  var _account: Account

  construct(account: Account) {
    _account = account
  }

  /**
   * Find policy targets for IR processing only
   */
  public function findPolicyTargets_ACC(levyYear : Integer, recordType : IRExtRecordType_ACC, bundle : Bundle) : List<PolicyPeriod> {
    var targets = new HashSet<PolicyPeriod>()
    var productCode = deriveProductCodeFromRecordType(recordType)

    var query = Query.make(PolicyTerm)
    query.compare(PolicyTerm#AEPACCNumber_ACC, Equals, _account.ACCID_ACC)
    query.compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
    query.compare(PolicyTerm#AEPFinancialYear_ACC, Equals, levyYear)

    var validTerms = query.select().toList()

    if (validTerms == null || !validTerms.HasElements) {
      return {}
    }

    validTerms.each(\term -> {
      var last = term.findLatestBoundOrAuditedPeriod_ACC()
      if (last != null) {
        if (!last.isCanceled()) {
          targets.add(last)
        } else {
          var startDate = last.PeriodStart
          var endDate = last.CancellationDate
          var termDays = DateUtil.differenceInDays(startDate, endDate)
          if (termDays != 0) {
            targets.add(last)
          }
        }
      }
    })

    targets.each(\pp -> {
      pp.Policy.cleanUpInternalJobs_ACC(bundle, ReasonCode.TC_IR_ACC)
    })

    return targets.toList()
  }

  /**
   * Find latest policy period for renewal...
   */
  public function findLatestPolicyForRenewal_ACC(recordType : IRExtRecordType_ACC) : PolicyPeriod[] {
    var targets = new HashSet<PolicyPeriod>()
    var productCode = deriveProductCodeFromRecordType(recordType)

    var policies = _account.Policies
    if (policies == null || policies.Count == 0) {
      return targets.toTypedArray()
    }
    policies.each(\policy -> {
      if (policy.ProductCode == productCode) {
        var period = policy.LatestBoundPeriod
        if (period != null) {
          targets.add(period)
        }
      }
    })
    if (targets.Count > 1) {
      return {targets.orderBy(\pp -> pp.PeriodEnd).last()}
    } else {
      return targets.toTypedArray()
    }
  }

  /**
   * Find latest of policy type.
   */
  public function findLatestPolicyPeriod(policyType : typekey.PolicyLine) : PolicyPeriod {
    var productCode = deriveProductCodeFromPolicyType(policyType)

    /**
     * Policy term in prerenewal state will not be returned since
     * policy term AEPACCNumber_ACC and AEPProductCode_ACC are null on prerenewals.
     */
    var policyTerm = Query.make(PolicyTerm)
        .compare(PolicyTerm#AEPACCNumber_ACC, Equals, _account.ACCID_ACC)
        .compare(PolicyTerm#AEPProductCode_ACC, Equals, productCode)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(PolicyTerm#AEPFinancialYear_ACC)))
        .thenByDescending(QuerySelectColumns.path(Paths.make(PolicyTerm#CreateTime)))
        .FirstResult

    return policyTerm?.findLatestBoundOrAuditedPeriod_ACC()
  }

  /**
   * Find regardless of policy type.
   */
  public function findLatestPolicyPeriod() : PolicyPeriod {
    var policies = _account.Policies
    if (policies == null || policies.Count == 0) {
      return null
    }
    for (policy in policies) {
      var period = policy.PolicyTermFinder_ACC.findLatestPolicyTerm()?.findLatestBoundOrAuditedPeriod_ACC()
      if (period != null) {
        return period
      }
    }
    return null
  }


  /**
   * Derive product code from action type
   */
  private function deriveProductCodeFromRecordType(recordType : IRExtRecordType_ACC) : String {
    if (recordType == IRExtRecordType_ACC.TC_CARA6) {
      return ConstantPropertyHelper.PRODUCTCODE_WPC
    } else if (recordType == IRExtRecordType_ACC.TC_CARA4) {
      return ConstantPropertyHelper.PRODUCTCODE_CP
    } else if (recordType == IRExtRecordType_ACC.TC_CARA5) {
      return ConstantPropertyHelper.PRODUCTCODE_WPS
    }
    return null
  }

  /**
   * Derive product code by PolicyLine
   */
  private function deriveProductCodeFromPolicyType(policyType : typekey.PolicyLine) : String {
    if (policyType == PolicyLine.TC_EMPWPCLINE) {
      return ConstantPropertyHelper.PRODUCTCODE_WPC
    } else if (policyType == PolicyLine.TC_INDCOPLINE || policyType == PolicyLine.TC_INDCPXLINE) {
      return ConstantPropertyHelper.PRODUCTCODE_CP
    } else if (policyType == PolicyLine.TC_CWPSLINE) {
      return ConstantPropertyHelper.PRODUCTCODE_WPS
    }
    return null
  }
}
