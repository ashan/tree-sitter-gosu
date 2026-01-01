package nz.co.acc.common.upgrade.after

uses gw.api.database.upgrade.after.AfterUpgradeVersionTrigger
uses gw.api.datamodel.upgrade.IDatamodelChange
uses gw.lang.reflect.IType
uses nz.co.acc.common.upgrade.IUpgradeRegister

/**
 * @author Ron Webb
 * @since 2019-06-17
 */
abstract class AbstractAfterUpgradeRegister implements IUpgradeRegister {

  protected var _registry : List<IDatamodelChange<AfterUpgradeVersionTrigger>>

  public construct(registry : List<IDatamodelChange<AfterUpgradeVersionTrigger>>) {
    _registry=registry
  }

  public static property get Implementations() : List<IType> {
    return AbstractAfterUpgradeRegister.Type.Subtypes
  }
}