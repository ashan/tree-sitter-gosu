package nz.co.acc.er.businessgroup

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.ERSearchResultsCounter_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.Types

class BusinessGroupSearchPopupCriteria_ACC extends BusinessGroupSearchCriteria_ACC {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(BusinessGroupSearchPopupCriteria_ACC)

  construct(levyYear : Integer) {
    this.LevyYear = levyYear
  }

  static function validateLevyYear(levyYear : Integer) {
    if(levyYear == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.NoLevyYear_ACC"))
    }
  }

  function performSearch(rowCounter : ERSearchResultsCounter_ACC) : BusinessGroupSearchResult_ACC[] {
    validateLevyYear(this.LevyYear)
    if(this.BusinessGroupID == null and this.CompanyID == null and this.ACCPolicyID == null and this.Name == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.BusinessGroupSearch.InsufficientSearchInfo_ACC"))
    }
    rowCounter.TotalRows = 0

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.SearchBusinessGroupsRecalc)
      if(this.BusinessGroupID != null) {
        stmt.setInt(1, this.BusinessGroupID)
      } else {
        stmt.setNull(1, Types.INTEGER)
      }
      if(this.CompanyID != null) {
        stmt.setInt(2, this.CompanyID)
      } else {
        stmt.setNull(2,Types.INTEGER)
      }
      if(this.ACCPolicyID != null) {
        stmt.setString(3, this.ACCPolicyID)
      } else {
        stmt.setNull(3, Types.VARCHAR)
      }
      if(this.Name != null) {
        stmt.setString(4, this.Name)
      } else {
        stmt.setNull(4, Types.VARCHAR)
      }
      stmt.setInt(5, this.LevyYear)
      stmt.setInt(6, (ScriptParameters.getParameterValue("ERSearchResultLimit_ACC") as Integer))
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

}