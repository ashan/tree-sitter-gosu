package gw.plugin.preupdate.impl


uses entity.Activity
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger
uses gw.transaction.AbstractBundleTransactionCallback
uses nz.co.acc.history.CustomHistoryHelper_ACC
uses nz.co.acc.validforclaims.ValidForClaimsPreUpdate

/**
 * AbstractBundleTransactionCallback is called very late in the bundle commit process, enabling
 * us to capture correct values for uncommitted bean updates.
 */
class TransactionCallback_ACC extends AbstractBundleTransactionCallback {
  var _log = StructuredLogger.CONFIG.withClass(TransactionCallback_ACC)

  construct() {
  }

  public static function createCallbackFor(
      bundle : Bundle) : TransactionCallback_ACC {
    for (var callback in bundle.BundleTransactionCallbacks) {
      if (callback typeis TransactionCallback_ACC) {
        return callback
      }
    }
    var newCallback = new TransactionCallback_ACC()
    bundle.addBundleTransactionCallback(newCallback)
    return newCallback
  }

  override function afterSearchDenormObjects(bundle : Bundle) {
    super.afterSearchDenormObjects(bundle)
    for (bean in bundle.InsertedBeans) {
      switch (typeof bean) {
        case Activity:
          CustomHistoryHelper_ACC.activityHistory(bean)
          break
        case Policy:
          ValidForClaimsPreUpdate.executePreUpdate(bean)
          break
        case PolicyPeriod:
          ValidForClaimsPreUpdate.executePreUpdate(bean)
          break
        default:
          break
      }
    }

    for (bean in bundle.UpdatedBeans) {
      switch (typeof bean) {
        case Activity:
          CustomHistoryHelper_ACC.activityHistory(bean)
          break
        case Policy:
          ValidForClaimsPreUpdate.executePreUpdate(bean)
          break
        case PolicyPeriod:
          ValidForClaimsPreUpdate.executePreUpdate(bean)
          break
        default:
          break
      }
    }

    for (bean in bundle.RemovedBeans) {
      switch (typeof bean) {
        case Activity:
          CustomHistoryHelper_ACC.activityHistory(bean)
          break
        default:
          break
      }
    }
  }

  private function logBeans(bun : Bundle) {
    if (bun.InsertedBeans.Count == 0
        and bun.RemovedBeans.Count == 0
        and bun.UpdatedBeans.Count == 1
        and bun.UpdatedBeans.hasMatch(\bean -> bean typeis ClusterMemberData)) {
      return
    }
    _log.info("=== Transaction CallBack Beans ===")
    _log.info("InsertedBeans: ${bun.InsertedBeans.map(\b -> b.Class.TypeName)}")
    _log.info("UpdatedBeans: ${bun.UpdatedBeans.map(\b -> b.Class.TypeName)}")
    _log.info("RemovedBeans: ${bun.RemovedBeans.map(\b -> b.Class.TypeName)}")
  }
}
