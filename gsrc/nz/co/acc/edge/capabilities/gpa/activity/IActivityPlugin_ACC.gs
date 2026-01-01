package nz.co.acc.edge.capabilities.gpa.activity

uses edge.capabilities.gpa.activity.IActivityPlugin
uses edge.capabilities.gpa.activity.dto.ActivityDTO

/**
 * Created by nitesh.gautam on 04-May-17.
 */
interface IActivityPlugin_ACC extends IActivityPlugin {
  function createStatusActivityForAccount(anAccount: Account, dto: ActivityDTO): Activity
}