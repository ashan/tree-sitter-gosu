package nz.co.acc.common.upgrade.before.impl

uses gw.api.database.upgrade.DatamodelChangeWithoutArchivedDocumentChange
uses gw.api.database.upgrade.before.BeforeUpgradeVersionTrigger
uses gw.api.datamodel.upgrade.IDatamodelChange
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.upgrade.DatamodelUpgradeEvent
uses nz.co.acc.common.upgrade.DatamodelUpgradeType
uses nz.co.acc.common.upgrade.before.AbstractBeforeUpgradeRegister
uses nz.co.acc.common.upgrade.function.DescriptorGenerator

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
class SQLUpgraderRegister extends AbstractBeforeUpgradeRegister {

  public construct(registry : List<IDatamodelChange<BeforeUpgradeVersionTrigger>>) {
    super(registry)
  }

  /**
   * Scans scripts directories for relevant files, creates/adds triggers to _registry list
   */
  override function register() {
    Funxion.buildGenerator(DescriptorGenerator.forUpgradeScripts(DatamodelUpgradeType.SQL_SCRIPT, DatamodelUpgradeEvent.BEFORE_UPGRADE))
        .generate()?.each(\___descriptor ->
            _registry.add(DatamodelChangeWithoutArchivedDocumentChange.make(new SQLUpgrader(___descriptor)))
        )

    Funxion.buildGenerator(DescriptorGenerator.forStartupScripts(DatamodelUpgradeType.SQL_SCRIPT, DatamodelUpgradeEvent.BEFORE_UPGRADE))
        .generate()?.each(\___descriptor ->
            _registry.add(DatamodelChangeWithoutArchivedDocumentChange.make(new SQLUpgrader(___descriptor)))
        )
  }
}