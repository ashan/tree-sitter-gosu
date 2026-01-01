package nz.co.acc.integration.restapi

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.json.JsonConfigAccess
uses gw.api.json.mapping.TransformResult
uses gw.api.locale.DisplayKey
uses gw.api.path.Paths
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.transaction.Transaction
uses nz.co.acc.lob.common.DateUtil_ACC
uses gw.surepath.suite.integration.logging.StructuredLogger

class RenewalAPIHandler {

  function renewPolicyToLatestYear(accPolicyID : String) : TransformResult {
    StructuredLogger.INTEGRATION.info(this + "Starting RenewalAPIHandler::renewPolicyToLatestYear")
    if (accPolicyID == null) {
      throw new RequiredFieldException(DisplayKey.get("PolicyRenewalAPI.StartRenewals.Error.NullArgument"))
    }


    var policyTermQuery = Query.make(PolicyTerm)
    policyTermQuery.compare(PolicyTerm#MostRecentTerm, Relop.Equals, true)
    policyTermQuery.withDistinct(true)
    var policyPeriodQuery = policyTermQuery.join(PolicyPeriod#PolicyTerm)
    policyPeriodQuery.compare(PolicyPeriod#ACCPolicyID_ACC, Relop.Equals, accPolicyID)
    var results = policyTermQuery.select().orderByDescending(QuerySelectColumns.path(Paths.make(PolicyTerm#AEPFinancialYear_ACC)))
        .thenByDescending(QuerySelectColumns.path(Paths.make(PolicyTerm#CreateTime)))

    if (results.FirstResult == null) {
      throw new BadIdentifierException(DisplayKey.get("PolicyRenewalAPI.StartRenewals.Error.InvalidPolicyNumber", accPolicyID))
    }

    var period = results.FirstResult.findLatestBoundOrAuditedPeriod_ACC()
    var currentLevyYear = DateUtil_ACC.getCurrentLevyYear()

    while (currentLevyYear != period.LevyYear_ACC) {
      Transaction.runWithNewBundle(\bundle -> {
        var renewal = new Renewal(bundle)
        StructuredLogger.INTEGRATION.debug(this + "Starting renewal job")
        renewal.startJob(period.Policy)
        StructuredLogger.INTEGRATION.debug(this + "Renewal Job started")
        period = renewal.LatestPolicyPeriod
        period.RenewalProcess.requestQuote()
        period.RenewalProcess.issueJob(true)
        StructuredLogger.INTEGRATION.debug(this + "Renewal Job issued")
      })
    }

    StructuredLogger.INTEGRATION.debug(this + "Bundle committed")

    var jsonMapper = JsonConfigAccess.getMapper("acc.policy.policyperiod-1.0", "PolicyPeriod")
    StructuredLogger.INTEGRATION.info("Renewal job done")
    return jsonMapper.transformObject(period)
  }
}