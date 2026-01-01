package nz.co.acc.edge.capabilities.policychange.item

/**
 * Created by manubaf on 12/11/2019.
 */
class ActivityItem {
  var _activityPattern : String
  var _subject : String
  var _description : String
  var _costChangeReason : ChangeReason_ACC

  construct(subject: String, description: String, activityPattern : String, costChangeReason:ChangeReason_ACC) {
    this._subject = subject
    this._description = description
    this._activityPattern = activityPattern
    this._costChangeReason = costChangeReason
  }

  property set CostChangeReason(changeReason:ChangeReason_ACC) {
    _costChangeReason = changeReason
  }

  property get CostChangeReason() : ChangeReason_ACC {
    return _costChangeReason
  }

  property get Description() : String{
    return _description
  }

  property get Subject() : String {
    return _subject
  }

  property get ActivityPattern() : String {
    return _activityPattern
  }

  function setActivityPattern(activityPattern:String) {
    _activityPattern = activityPattern
  }
}