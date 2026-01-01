package nz.co.acc.edge.capabilities.helpers

uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses edge.exception.EntityNotFoundException
uses gw.api.database.Query
uses gw.api.locale.DisplayKey
uses typekey.*

/**
 * Created by Stephen.Zhang on 6/22/2017.
 */
class HistoryUtil_ACC {
  final private static  var LOGGER = new Logger(Reflection.getRelativeName(HistoryUtil_ACC))

  /**
   * Find Historys using the given a particular bean
   *
   * @param bean Keyable bean to search by, could be an Account or Policy
   * @return All History records of given ACC account number
   */
  public static function getHistory(bean : KeyableBean) : History[] {
    if(bean == null ) {
      LOGGER.logError("getHistory: given argument was null")
      throw new IllegalArgumentException(DisplayKey.get("Edge.Capabilities.Helpers.Exception.GethistoryGivenArgumentMustNotBeNull"))
    }
    var criteria = new gw.history.HistorySearchCriteria() {:RelatedItem = bean}
    return criteria.performSearch().toTypedArray()
  }
}