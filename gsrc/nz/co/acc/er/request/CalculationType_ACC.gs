package nz.co.acc.er.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC


uses java.io.Serializable

/**
 * Created by nowchoo on 27/08/2019.
 */
class CalculationType_ACC extends ERDatabaseController_ACC implements Serializable {
  private var _calculationTypeCode : String as CalculationTypeCode
  private var _calculationTypeDescription : String as CalculationTypeDescription
  private var _levyYear : Integer as levyYear
  private static var _logger = StructuredLogger.INTEGRATION.withClass(CalculationType_ACC)

  function retrieveAll() : CalculationType_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.RetrieveAllERCalculationTypes)
      executeQuery()

      var allTypes = new ArrayList<CalculationType_ACC>()
      while (rs.next()) {
        var type = new CalculationType_ACC()
        type.CalculationTypeCode = rs.getString("CalculationTypeCode")
        type.CalculationTypeDescription = rs.getString("CalculationTypeDescription")
        type._levyYear = rs.getInt("LevyYear")
        allTypes.add(type)
      }
      return allTypes.toTypedArray()
    } catch (e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if (e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    } finally {
      closeDbConnection()
    }
  }

  override function toString() : String {
    return this.CalculationTypeCode
  }
}