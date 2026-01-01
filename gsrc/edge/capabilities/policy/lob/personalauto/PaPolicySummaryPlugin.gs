package edge.capabilities.policy.lob.personalauto

uses edge.PlatformSupport.TranslateUtil
uses edge.di.annotations.InjectableNode
uses edge.capabilities.policy.lob.ILobPolicySummaryPlugin


class PaPolicySummaryPlugin implements ILobPolicySummaryPlugin{

  @InjectableNode
  construct() {
  }


  /**
   * Returns summary information for vehicles and drivers of a policy
   */
  override function getPolicyLineOverview(period : PolicyPeriod) : String {
    if(period.PersonalAutoLineExists) {
      return TranslateUtil.translate("displaykey.Edge.Web.Api.PolicyHandler.Overview", {
        period.PersonalAutoLine.Vehicles.length,
        period.PersonalAutoLine.PolicyDrivers.length
      })
    }

    return null
  }

}
