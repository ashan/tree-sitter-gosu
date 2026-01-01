package nz.co.acc.gwer.businessgroup

uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Key
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.gwer.ERPersistenceUtil_ACC
uses nz.co.acc.gwer.ERSearchResultsCounter_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper
uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Types
uses gw.api.database.Query


class BusinessGroupSearchCriteria_ACC implements Serializable {

  private static var _logger = StructuredLogger.INTEGRATION.withClass(BusinessGroupSearchCriteria_ACC)

  private var _businessGroupId : Long as BusinessGroupID

  private var _companyID : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _accPolicyIdList : String as ACCPolicyIDList

  private var _name : String as Name

  private var _levyYear : Integer as LevyYear

  function performSearchBusinessGroupMember(rowCounter : ERSearchResultsCounter_ACC) : ERBusinessGroupMember_ACC[] {
    rowCounter.TotalRows = 0

    try {

      var bgmQuery = Query.make(ERBusinessGroupMember_ACC)
      if(this.BusinessGroupID != null) {
        bgmQuery.join(ERBusinessGroupMember_ACC#ERBusinessGroup)
            .compare(ERBusinessGroup_ACC#ID, Relop.Equals, new Key(ERBusinessGroup_ACC, Long.valueOf(this.BusinessGroupID)))
      }

      if(this.ACCPolicyID.HasContent) {
        bgmQuery.compare(ERBusinessGroupMember_ACC#ACCPolicyID_ACC, Relop.Equals, this.ACCPolicyID)
      }

      if(this.CompanyID != null) {
        bgmQuery.compare(ERBusinessGroupMember_ACC#CompanyID, Relop.Equals, this.CompanyID)
      }

//      if(this.Name.HasContent) {
//        bgmQuery.contains(ERBusinessGroupMember_ACC#MemberAccountName, this.Name, true)
//      }
      var results = bgmQuery.select()
      rowCounter.TotalRows = results.Count
      return results.toTypedArray()
    }
    catch(e : Exception) {
      _logger.error_ACC("ERBusinessGroup", e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", "ERBusinessGroup"))
    }
  }

//  function performSearchFromACCPolicyIDsWithResultLimit(rowCounter : ERSearchResultsCounter_ACC, numberOfResults : int) : BusinessGroupMemberPair_ACC[] {
//    if(this.ACCPolicyIDList == null) {
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupSearch.InsufficientSearchInfo_ACC"))
//    }
//    rowCounter.TotalRows = 0
//
//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.SearchBusinessGroupMembership)
//      if(this.ACCPolicyIDList != null) {
//        stmt.setString(1, this.ACCPolicyIDList)
//      } else {
//        stmt.setNull(1, Types.INTEGER)
//      }
//      if(this.LevyYear != null) {
//        stmt.setInt(2, this.LevyYear)
//      } else {
//        stmt.setNull(2,Types.INTEGER)
//      }
//      executeQuery()
//
//      var results = new ArrayList<BusinessGroupMemberPair_ACC>()
//      while(rs.next()) {
//        var result = new BusinessGroupMemberPair_ACC()
//        var businessGroupID = rs.getInt("BusinessGroupID")
//        if(rs.wasNull()) {
//          result.BusinessGroupID = null
//        } else {
//          result.BusinessGroupID = businessGroupID
//        }
//        result.ACCPolicyID = rs.getString("ACCPolicyID")
//        results.add(result)
//      }
//      return results.toTypedArray()
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
//  }

}