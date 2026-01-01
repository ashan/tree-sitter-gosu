package nz.co.acc.common.edge.security

uses edge.di.annotations.ForAllGwNodes
uses nz.co.acc.common.edge.security.permission.BCSSUser_ACC

/**
 * Created by KasthuA on 24/05/2017.
 */
class BCSSUserProvider_ACC {
  @ForAllGwNodes
  construct() {}

  private static var _bcssUser = new ThreadLocal<BCSSUser_ACC>()

  public static function setBCSSUser(aUser:BCSSUser_ACC) {
    _bcssUser.set(aUser)
  }

  public static function getBCSSSUser():BCSSUser_ACC {
    return _bcssUser.get()
  }
}