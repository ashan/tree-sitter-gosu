package nz.co.acc.edge.capabilities.gpa.activity

uses edge.PlatformSupport.Bundle
uses edge.capabilities.gpa.activity.DefaultActivityPatternPlugin
uses edge.capabilities.gpa.activity.DefaultActivityPlugin
uses edge.capabilities.gpa.activity.IActivityPatternPlugin
uses edge.capabilities.gpa.activity.dto.ActivityDTO
uses edge.capabilities.gpa.note.INotePlugin
uses edge.capabilities.user.IUserPlugin
uses edge.di.annotations.ForAllGwNodes
uses edge.di.annotations.ForAllNodes
uses gw.api.locale.DisplayKey
uses nz.co.acc.account.AccountUtil

/**
 * Created by nitesh.gautam on 04-May-17.
 */
class ActivityPlugin_ACC extends DefaultActivityPlugin implements IActivityPlugin_ACC {

  private var _activityPatternPlugin : IActivityPatternPlugin

  @ForAllNodes
  construct(aUserPlugin : IUserPlugin, anActivityPatternPlugin : IActivityPatternPlugin, aNotePlugin : INotePlugin){
    super(aUserPlugin, anActivityPatternPlugin, aNotePlugin)
    this._activityPatternPlugin = anActivityPatternPlugin
  }

  override public function createStatusActivityForAccount(anAccount: Account, dto: ActivityDTO): Activity {
    final var anActPattern = AccountUtil.getAccountActivityPattern_ACC()
    var anActivity = anAccount.newActivity(anActPattern)
    anActivity = AccountUtil.updateAccountActivity(anActivity, anAccount, dto.Subject, dto.Description)
    updateBaseProperties(anActivity, dto)
    anActivity.Status = typekey.ActivityStatus.TC_OPEN
    anActivity.Priority = anActPattern.Priority

    return anActivity
  }

  override function createActivityForPolicy(aPolicy: Policy, dto: ActivityDTO): Activity {
    final var bundle = Bundle.getCurrent()
    final var anActPattern = _activityPatternPlugin.getActivityPatternByCode(dto.ActivityPattern.Code)
    final var anActivity = anActPattern.createPolicyActivity(bundle.PlatformBundle, aPolicy, dto.Subject, dto.Description, null, dto.Priority, dto.Mandatory, dto.DueDate, dto.EscalationDate)
    updateBaseProperties(anActivity, dto)
//    anActivity.setFieldValue(DisplayKey.get("Edge.Capabilities.Activity.Field.PreviousUser"), User.util.CurrentUser)
    anActivity.setFieldValue("PreviousUser", User.util.CurrentUser)
    anActivity.Status = typekey.ActivityStatus.TC_OPEN

    return anActivity
  }
}