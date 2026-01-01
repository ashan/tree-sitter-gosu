package nz.co.acc.common.upgrade

/**
 * @author Ron Webb
 * @since 2019-06-17
 */
enum DatamodelUpgradeEvent {
  BEFORE_UPGRADE,
  AFTER_UPGRADE

  public static function of(value : String) : DatamodelUpgradeEvent {
    return DatamodelUpgradeEvent.valueOf(value?.toUpperCase())
  }
}