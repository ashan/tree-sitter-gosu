package nz.co.acc.dashboard_acc

uses gw.processes.BatchProcessBase

/**
 * Created by manubaf on 18/03/2020.
 */
class UpdateDashboardHistory_ACC extends BatchProcessBase {
  /**
   * Constructor
   */
  construct() {
    super(BatchProcessType.TC_UPDATEDASHBOARDHISTORY_ACC)
  }

  protected override function doWork() {
    DashboardUIHelper.generateDashBoardHistory()
  }
}