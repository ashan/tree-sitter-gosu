package nz.co.acc.er.request

uses java.io.Serializable
uses java.lang.invoke.MethodHandles
uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses gw.surepath.suite.integration.logging.StructuredLogger


class RequestGroupType_ACC extends ERDatabaseController_ACC implements Serializable {
  private var _requestGroupTypeId : Integer as RequestGroupTypeID
  private var _sortOrder : Integer as SortOrder
  private var _requestGroupTypeCode : String as RequestGroupTypeCode
  private var _description : String as Description
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  function retrieveAll() : RequestGroupType_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveAllERRequestGroupTypeOptions)
      executeQuery()

      var allTypes = new ArrayList<RequestGroupType_ACC>()
      while(rs.next()) {
        var id = rs.getInt("RequestGroupTypeID")
        var sortOrder = rs.getInt("SortOrder")
        var code = rs.getString("RequestGroupTypeCode")
        var desc = rs.getString("RequestGroupTypeDescription")
        var type = new RequestGroupType_ACC()
        type._requestGroupTypeId = id
        type._sortOrder = sortOrder
        type.RequestGroupTypeCode = code
        type._description = desc
        allTypes.add(type)
      }
      return allTypes.toTypedArray()
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

  function getOptions(requestType : RequestType_ACC) : RequestGroupType_ACC[] {
    var allTypes = retrieveAll()
    var options = new ArrayList<RequestGroupType_ACC>()
    if(requestType.RequestTypeCode == "REC") {
      allTypes.each(\gt -> {
        if(gt.RequestGroupTypeCode == "SEL") {
          options.add(gt)
        }
      })
    } else if(requestType.RequestTypeCode == "ANN" or requestType.RequestTypeCode == "TRL") {
      allTypes.each(\gt -> {
        if(gt.RequestGroupTypeCode != "SEL") {
          options.add(gt)
        }
      })
    }
    return options.toTypedArray()
  }

  override function toString(): String {
    return this.Description
  }
}