package nz.co.acc.common.upgrade.after.impl

uses gw.api.database.upgrade.DatamodelChangeWithoutArchivedDocumentChange
uses gw.api.database.upgrade.after.AfterUpgradeVersionTrigger
uses gw.api.datamodel.upgrade.IDatamodelChange
uses nz.co.acc.common.function.Funxion
uses nz.co.acc.common.upgrade.DatamodelUpgradeEvent
uses nz.co.acc.common.upgrade.DatamodelUpgradeType
uses nz.co.acc.common.upgrade.after.AbstractAfterUpgradeRegister
uses nz.co.acc.common.upgrade.function.DescriptorGenerator

/**
 * @author Ron Webb
 * @since 2019-06-17
 */
class GosuUpgraderRegister extends AbstractAfterUpgradeRegister {
  public construct(registry : List<IDatamodelChange<AfterUpgradeVersionTrigger>>) {
    super(registry)
  }

  /**
   * Scans scripts directories for relevant files, creates/adds triggers to _registry list
   */
  override function register() {
    Funxion.buildGenerator(DescriptorGenerator.forUpgradeScripts(DatamodelUpgradeType.GOSU_SCRIPT, DatamodelUpgradeEvent.AFTER_UPGRADE))
        .generate()?.each(\___descriptor -> {
          _registry.add(DatamodelChangeWithoutArchivedDocumentChange.make(new GosuUpgrader(___descriptor)))
        })

    Funxion.buildGenerator(DescriptorGenerator.forStartupScripts(DatamodelUpgradeType.GOSU_SCRIPT, DatamodelUpgradeEvent.AFTER_UPGRADE))
        .generate()?.each(\___descriptor -> {
          _registry.add(DatamodelChangeWithoutArchivedDocumentChange.make(new GosuUpgrader(___descriptor)))
        })
  }

}