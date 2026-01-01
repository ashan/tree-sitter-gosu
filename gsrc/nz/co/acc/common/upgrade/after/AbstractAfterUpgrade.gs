package nz.co.acc.common.upgrade.after

uses gw.api.database.upgrade.after.AfterUpgradeVersionTrigger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.CurrentExtension

/**
 * @author Ron Webb
 * @since 2019-06-17
 */
abstract class AbstractAfterUpgrade extends AfterUpgradeVersionTrigger {

  public construct(minorVersionWhenTriggerIsApplicable : int) {
    super(minorVersionWhenTriggerIsApplicable)
  }

  public construct() {
    this(Funxion.buildGenerator(new CurrentExtension()).generate())
  }

}