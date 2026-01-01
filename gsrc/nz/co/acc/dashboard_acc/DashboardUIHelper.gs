package nz.co.acc.dashboard_acc

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.util.DisplayableException
uses gw.transaction.Transaction
uses nz.co.acc.common.util.HikariJDBCConnectionPool
uses java.util.concurrent.CopyOnWriteArrayList

/**
 * Created by manubaf on 11/03/2020.
 */
class DashboardUIHelper {
  private var _searchResult : IQueryBeanResult<DashboardMapping_ACC>as SearchResult
  private var _searchDate : Date as SearchDate
  private var _editMode : Boolean as EditMode

  /**
   * Constructor
   */
  public construct() {
    _searchResult = Query.make(DashboardMapping_ACC).select()
    _searchDate = Date.CurrentDate
    _editMode = Boolean.FALSE
  }

  public property get EditMode() : Boolean {
    return _editMode
  }

  public property set EditMode(editMode:Boolean) {
    _editMode = editMode
  }

  public function addNewRecord() : DashboardMapping_ACC {
    return new DashboardMapping_ACC()
  }

  /**
   * Getter for SearchDate
   */
  public property get SearchDate() : Date {
    return _searchDate
  }

  /**
   * Setter for SearchDate
   */
  public property set SearchDate(searchDate : Date) {
    _searchDate = searchDate
  }

  public function generateDashboardHistory(refreshDate : Date, retrieveLatest : boolean) : List<DashboardHistory_ACC> {
    var dashboardHistoryList = new CopyOnWriteArrayList<DashboardHistory_ACC>();
    if (retrieveLatest and refreshDate.trimToMidnight().equals(Date.CurrentDate.trimToMidnight())) {
      dashboardHistoryList.addAll(generateDashBoardHistory())
    } else {
      dashboardHistoryList.addAll(Query.make(DashboardHistory_ACC).compare(DashboardHistory_ACC#ExtractDate, Relop.Equals, refreshDate).select().toCollection())
    }

    return dashboardHistoryList
  }

  public static function generateDashBoardHistory() : List<DashboardHistory_ACC> {
    var pRecordToDelete = Query.make(DashboardHistory_ACC)
        .compare(DashboardHistory_ACC#ExtractDate, Relop.Equals, Date.CurrentDate.trimToMidnight()).select()

    for (p in pRecordToDelete) {
      Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        bundle.delete(p)
      })
    }

    return queryAndGenerateDashboardRecord()
  }

  public static function queryAndGenerateDashboardRecord() : List<DashboardHistory_ACC> {
    var sqlString = ActivityDashboardQuery.renderToString()
    var connection = HikariJDBCConnectionPool.getInstance().getConnection()
    var preparedStatement = connection.prepareStatement(sqlString)
    var historyList : List<DashboardHistory_ACC>
    try {
      var resultSet = preparedStatement.executeQuery()
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        historyList = new ArrayList<DashboardHistory_ACC>()
        while (resultSet.next()) {
          var history = new DashboardHistory_ACC()
          history.ExtractDate = Date.CurrentDate.trimToMidnight()
          history.GroupName = resultSet.getString("GroupName")
          history.JunoWork = resultSet.getString("JunoWork")
          history.Untouched = resultSet.getInt("Untouched")
          history.Completed = resultSet.getInt("Completed")
          history.ReceivedToday = resultSet.getInt("ReceivedToday")
          history.OldestDate = resultSet.getDate("OldestDate")
          history.AgeInDays = resultSet.getInt("AgeInDays")
          history.SLA_Color = SLAColor_ACC.get(resultSet.getString("SLA_Color"))
          history.DateMoved = resultSet.getString("DateMoved")
          historyList.add(history)
        }
      }, "sys")
    } catch (e : Exception) {
      e.printStackTrace()
    } finally {
      preparedStatement.close()
      connection.close()
    }

    return historyList
  }

  function convertSLA(VALUE : String, higherSLA : boolean, dashboardItem : DashboardMapping_ACC) : int {
    if(!VALUE.HasContent) {
      throw new DisplayableException("value not set")
    }

    var value = VALUE.toInt()
    if(higherSLA and value < dashboardItem.LowerSLA) {
      throw new DisplayableException("should be greater than Lower SLA")
    } else if (!higherSLA and value > dashboardItem.HigherSLA){
      throw new DisplayableException("should be lesser than Higher SLA")
    }
    return value
  }
}