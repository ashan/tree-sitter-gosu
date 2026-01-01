package nz.co.acc.er.businessgroup

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.ERSearchResultsCounter_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper
uses java.io.Serializable
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Types


class BusinessGroupSearchCriteria_ACC extends ERDatabaseController_ACC implements Serializable {

  private static var _logger = StructuredLogger.INTEGRATION.withClass(BusinessGroupSearchCriteria_ACC)

  private var _businessGroupId : Integer as BusinessGroupID

  private var _companyId : Integer as CompanyID

  private var _accPolicyId : String as ACCPolicyID

  private var _accPolicyIdList : String as ACCPolicyIDList

  private var _name : String as Name

  private var _levyYear : Integer as LevyYear

  function performSearch(rowCounter : ERSearchResultsCounter_ACC) : BusinessGroupSearchResult_ACC[] {
    return performSearchWithResultLimit(rowCounter, ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer)
  }

  function performSearchWithResultLimit(rowCounter : ERSearchResultsCounter_ACC, numberOfResults : int) : BusinessGroupSearchResult_ACC[] {
    if(this.BusinessGroupID == null and this.CompanyID == null and this.ACCPolicyID == null and this.Name == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupSearch.InsufficientSearchInfo_ACC"))
    }
    rowCounter.TotalRows = 0

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchBusinessGroups)
      if(this.BusinessGroupID != null) {
        stmt.setInt(1, this.BusinessGroupID)
      } else {
        stmt.setNull(1, Types.INTEGER)
      }
      stmt.setNull(2, Types.INTEGER)
      if(this.CompanyID != null) {
        stmt.setInt(3, this.CompanyID)
      } else {
        stmt.setNull(3,Types.INTEGER)
      }
      if(this.ACCPolicyID != null) {
        stmt.setString(4, this.ACCPolicyID)
      } else {
        stmt.setNull(4, Types.VARCHAR)
      }
      if(this.Name != null) {
        stmt.setString(5, this.Name)
      } else {
        stmt.setNull(5, Types.VARCHAR)
      }
      stmt.setNull(6, Types.INTEGER)
      stmt.setInt(7, numberOfResults)
      executeQuery()

      var results = new ArrayList<BusinessGroupSearchResult_ACC>()
      while(rs.next()) {
        var result = new BusinessGroupSearchResult_ACC()
        var businessGroupID = rs.getInt("BusinessGroupID")
        if(rs.wasNull()) {
          result.BusinessGroupID = null
        } else {
          result.BusinessGroupID = businessGroupID
        }
        result.GroupMemberID = rs.getInt("LevyPayerID")
        var companyId = rs.getInt("CompanyID")
        if(rs.wasNull()) {
          result.CompanyID = null
        } else {
          result.CompanyID = companyId
        }
        result.ACCPolicyID = rs.getString("ACCPolicyID")
        result.Name = rs.getString("Name")
        result.NonPayroll = "Y" == (rs.getString("NonPayroll"))
        var ceasedTradingDate = rs.getDate("CeasedTradingDate")
        if(rs.wasNull()) {
          result.CeasedTradingDate = null
        } else {
          result.CeasedTradingDate = ceasedTradingDate
        }
        var membershipStart = rs.getDate("MembershipStart")
        if(rs.wasNull()) {
          result.GroupStartDate = null
        } else {
          result.GroupStartDate = membershipStart
        }
        var membershipEnd = rs.getDate("MembershipEnd")
        if(rs.wasNull()) {
          result.GroupEndDate = null
        } else {
          result.GroupEndDate = membershipEnd
        }

        /**
         * US12243 ER UI - GW - Business Groups - add TransferID to the fields returned after a search
         * 24.10.2018 NowchoO
         */
        result.SellerTransferIds = rs.getString("SellerTransferIDs")
        result.BuyerTransferIds= rs.getString("BuyerTransferIDs")

        rowCounter.TotalRows = rs.getInt("totalrows")
        results.add(result)
      }
      return results.toTypedArray()
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }
  }

  function performSearchFromACCPolicyIDsWithResultLimit(rowCounter : ERSearchResultsCounter_ACC, numberOfResults : int) : BusinessGroupMemberPair_ACC[] {
    if(this.ACCPolicyIDList == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupSearch.InsufficientSearchInfo_ACC"))
    }
    rowCounter.TotalRows = 0

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchBusinessGroupMembership)
      if(this.ACCPolicyIDList != null) {
        stmt.setString(1, this.ACCPolicyIDList)
      } else {
        stmt.setNull(1, Types.INTEGER)
      }
      if(this.LevyYear != null) {
        stmt.setInt(2, this.LevyYear)
      } else {
        stmt.setNull(2,Types.INTEGER)
      }
      executeQuery()

      var results = new ArrayList<BusinessGroupMemberPair_ACC>()
      while(rs.next()) {
        var result = new BusinessGroupMemberPair_ACC()
        var businessGroupID = rs.getInt("BusinessGroupID")
        if(rs.wasNull()) {
          result.BusinessGroupID = null
        } else {
          result.BusinessGroupID = businessGroupID
        }
        result.ACCPolicyID = rs.getString("ACCPolicyID")
        results.add(result)
      }
      return results.toTypedArray()
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }
  }

}