package nz.co.acc.common.upgrade.before

uses gw.api.database.upgrade.before.BeforeUpgradeVersionTrigger
uses gw.api.datamodel.upgrade.IDatamodelChange
uses gw.lang.reflect.IType
uses nz.co.acc.common.upgrade.IUpgradeRegister

/**
 * @author Ron Webb
 * @since 2019-06-14
 */
abstract class AbstractBeforeUpgradeRegister implements IUpgradeRegister {

  protected var _registry : List<IDatamodelChange<BeforeUpgradeVersionTrigger>>

  public construct(registry : List<IDatamodelChange<BeforeUpgradeVersionTrigger>>) {
    _registry=registry
  }

  public static property get Implementations() : List<IType> {
    return AbstractBeforeUpgradeRegister.Type.Subtypes
  }

}