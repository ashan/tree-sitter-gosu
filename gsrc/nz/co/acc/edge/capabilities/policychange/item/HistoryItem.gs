package nz.co.acc.edge.capabilities.policychange.item

uses edge.PlatformSupport.Bundle

/**
 * Created by manubaf on 12/11/2019.
 */
class HistoryItem {
  var _customType: CustomHistoryType
  var _description: String

  construct(type: CustomHistoryType, description: String) {
    this._customType = type
    this._description = description
  }

  property get Description(): String {
    return _description
  }

  property get CustomType(): CustomHistoryType {
    return _customType
  }

  function createWithoutJob(bundle: Bundle, policy: Policy) {
    var period = bundle.add(policy.LatestBoundPeriod)
    var history = period.createCustomHistoryEvent(this.CustomType, \-> this.Description)
    history.Job = null
    bundle.add(history)
  }
}