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

class RequestType_ACC extends ERDatabaseController_ACC implements Serializable {

  private var _requestTypeId : Integer as RequestTypeID
  private var _sortOrder : Integer as SortOrder
  private var _requestTypeCode : String as RequestTypeCode
  private var _description : String as Description
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  function avalableOptions() : RequestType_ACC[] {
    var requestTypes = retrieveAll()
    var options = new ArrayList<RequestType_ACC>()
    requestTypes.each(\option -> {
      if(perm.System.createrrecalculationrequestacc) {
        if(option.RequestTypeCode == "REC") {
          options.add(option)
        }
      }
      if (perm.System.createerrunrequestacc) {
        if(option.RequestTypeCode == "ANN" or
            option.RequestTypeCode == "TRL") {
          options.add(option)
        }
      }
    })
    return options.toTypedArray()
  }

  function retrieveAll() : RequestType_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveAllERRequestTypeOptions)
      executeQuery()

      var allTypes = new ArrayList<RequestType_ACC>()
      while(rs.next()) {
        var id = rs.getInt("RequestTypeID")
        var sortOrder = rs.getInt("SortOrder")
        var code = rs.getString("RequestTypeCode")
        var desc = rs.getString("RequestTypeDescription")
        var type = new RequestType_ACC()
        type._requestTypeId = id
        type._sortOrder = sortOrder
        type._requestTypeCode = code
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

  override function toString(): String {
    return this.Description
  }
}