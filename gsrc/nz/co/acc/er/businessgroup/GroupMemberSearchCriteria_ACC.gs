package nz.co.acc.er.businessgroup

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.ERSearchResultsCounter_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Types


class GroupMemberSearchCriteria_ACC implements Serializable {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(GroupMemberSearchCriteria_ACC)

  private var _companyId : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _name : String as Name

  function performSearch(rowCounter : ERSearchResultsCounter_ACC, businessGroupId : Integer) : BusinessGroupSearchResult_ACC[] {

    if(this.CompanyID == null and this.ACCPolicyID == null and this.Name == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.GroupMemberSearch.InsufficientSearchInfo_ACC"))
    }

    var proc = new StoreProcController_ACC()
    var results = proc.performSearch(rowCounter, businessGroupId, _companyId, _accPolicyId, _name)

    return results
  }

}