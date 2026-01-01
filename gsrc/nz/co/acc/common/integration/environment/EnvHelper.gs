package nz.co.acc.common.integration.environment

uses com.guidewire.pl.system.dependency.PLDependencies

/**
 * Helps to find out the Server Environment
 * Created by tappetv on 7/03/2017.
 */
class EnvHelper {

  private construct(){

  }

  /**
   *
   * @return true if environment of server is not Production
   */
  public static function isNotProductionEnvironment(): boolean{
    return PLDependencies.getServerMode().isDev() || PLDependencies.getServerMode().isTest();
  }

}
