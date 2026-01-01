package nz.co.acc.er.configuration

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.util.Pair
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.SQLException
uses java.sql.Types

class ERConfigurationUtil_ACC extends ERDatabaseController_ACC {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERConfigurationUtil_ACC)

  function RetrieveERConfiguration(configName : String) : Pair<String, String>[] {
    var configs = new ArrayList<Pair<String, String>>()

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveERConfiguration)
      if (configName != null) {
        stmt.setString(1, configName)
      } else {
        stmt.setNull(1, Types.VARCHAR)
      }
      rs = stmt.executeQuery()
      while(rs.next()) {
        configs.add(new Pair<String, String>(rs.getString("Name"), rs.getString("Value")))
      }
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

    return configs.toTypedArray()
  }

  function RetrieveERConfigurationAllValues() : Pair<String, String>[] {
    return this.RetrieveERConfiguration(null)
  }

  function RetrieveERConfigurationIntegerValue(configName : String) : Integer {
    var values = this.RetrieveERConfiguration(configName)
    if (values == null or values.Count == 0) {
      _logger.error_ACC(DisplayKey.get("Web.ExperienceRating.Configuration.NoRecordFound_ACC", configName))
    } else if (values.Count > 1) {
      _logger.error_ACC(
                       DisplayKey.get("Web.ExperienceRating.Configuration.MoreThanOneRecordFound_ACC", configName))
    } else {
      try {
        return Integer.valueOf(values[0].Second)
      } catch (e : Exception) {
        _logger.error_ACC(
                         DisplayKey.get("Web.ExperienceRating.Configuration.RecordValueNotInteger_ACC", configName))
      }
    }
    return null
  }

  function RetrieveERConfigurationStringValue(configName : String) : String {
    var values = this.RetrieveERConfiguration(configName)
    if (values == null or values.Count == 0) {
      _logger.error_ACC(
                       DisplayKey.get("Web.ExperienceRating.Configuration.NoRecordFound_ACC", configName))
    } else if (values.Count > 1) {
      _logger.error_ACC(
                       DisplayKey.get("Web.ExperienceRating.Configuration.MoreThanOneRecordFound_ACC", configName))
    } else {
      return values[0].Second
    }
    return null
  }

}