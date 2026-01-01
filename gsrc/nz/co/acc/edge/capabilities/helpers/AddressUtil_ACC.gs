package nz.co.acc.edge.capabilities.helpers

uses gw.api.util.DateUtil

/**
 * Utility methods for Address in edge module.
 * <p>
 * <strong>Usage</strong>:
 * <p>
 * To use this source as address utility:
 * <ol>
 * <li>Utilise the static method using ClassName.MethodName.</li>
 * <li>Refer to documentation for method to pass correct input and expected return type.</li>
 * </ol>
 * </p>
 * Created by nitesh.gautam on 24-Nov-17.
 */
class AddressUtil_ACC {
  /**
   * Checks if address is invalid for current date
   * @author nitesh.gautam
   * @param Address
   * @returns Boolean true if address is invalid and false if it is a valid address
   */
  public static function isAddressInvalid(address: Address): Boolean {
    return (address.ValidUntil == null or DateUtil.compareIgnoreTime(DateUtil.currentDate().trimToMidnight(), address.ValidUntil) <= 0) ? Boolean.FALSE : Boolean.TRUE
  }
}