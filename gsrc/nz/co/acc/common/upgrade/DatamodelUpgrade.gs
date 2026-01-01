package nz.co.acc.common.upgrade

uses gw.api.database.upgrade.VersionAction
uses gw.api.database.upgrade.after.AfterUpgradeVersionTrigger
uses gw.api.database.upgrade.before.BeforeUpgradeVersionTrigger
uses gw.api.datamodel.upgrade.CustomerDatamodelUpgrade
uses gw.api.datamodel.upgrade.IDatamodelChange
uses gw.plugin.upgrade.IDatamodelUpgrade
uses gw.lang.reflect.ReflectUtil

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.function.impl.GetScriptParameter
uses nz.co.acc.common.upgrade.after.AbstractAfterUpgradeRegister
uses nz.co.acc.common.upgrade.before.AbstractBeforeUpgradeRegister

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class DatamodelUpgrade extends CustomerDatamodelUpgrade implements IDatamodelUpgrade {


  private static var LOG = StructuredLogger.CONFIG.withClass(DatamodelUpgrade)

  public function register(classname : String, changes : List<IDatamodelChange<VersionAction>>) {
    var bootstapper = ReflectUtil.construct(classname, {changes}) as IUpgradeRegister
    bootstapper.register()
  }

  protected property get CanPerform() : Boolean {
    return Funxion.buildProcessor(new GetScriptParameter<Boolean>(true)).process("AutoDatamodelUpgrade")
  }

  override property get BeforeUpgradeDatamodelChanges() : List<IDatamodelChange<BeforeUpgradeVersionTrigger>> {
    var changes = new ArrayList<IDatamodelChange<BeforeUpgradeVersionTrigger>>()

    if (CanPerform) {
      AbstractBeforeUpgradeRegister.Implementations.each(\___bootstrapper -> {
        register(___bootstrapper.Name, changes)
      })
    }
    else {
      LOG.info("Automatic datamodel upgrade is not applicable")
    }

    return changes
  }

  override property get AfterUpgradeDatamodelChanges() : List<IDatamodelChange<AfterUpgradeVersionTrigger>> {
    var changes = new ArrayList<IDatamodelChange<AfterUpgradeVersionTrigger>>()

    if (CanPerform) {
      AbstractAfterUpgradeRegister.Implementations.each(\___bootstrapper -> {
        register(___bootstrapper.Name, changes)
      })
    } else {
      LOG.info("Automatic datamodel upgrade is not applicable")
    }

    return changes
  }
}