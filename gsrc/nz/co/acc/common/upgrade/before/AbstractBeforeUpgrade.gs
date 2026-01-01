package nz.co.acc.common.upgrade.before

uses gw.api.database.upgrade.before.BeforeUpgradeVersionTrigger
uses gw.api.database.upgrade.before.IBeforeUpgradeTable
uses gw.api.system.server.ServerUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.CurrentExtension
uses nz.co.acc.common.upgrade.DatamodelUpgrade

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
abstract class AbstractBeforeUpgrade extends BeforeUpgradeVersionTrigger {

  private static final var LOG = StructuredLogger.CONFIG.withClass(AbstractBeforeUpgrade)

  public construct(minorVersionWhenTriggerIsApplicable : int) {
    super(minorVersionWhenTriggerIsApplicable)
  }

  public construct() {
    this(Funxion.buildGenerator(new CurrentExtension()).generate())
  }

  override function hasVersionCheck() : boolean {
    return false
  }

  public property get ScriptExecutorTable() : IBeforeUpgradeTable {

    var productCode = ServerUtil.getProduct().ProductCode

    var table = this.getTable("${productCode}x_upgrade_executor_log")
    if (!table.exists() && table.existsInDatamodel()) {
      table = table.create()
    }

    return table
  }

}