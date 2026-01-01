package nz.co.acc.plm.common.environment

uses com.guidewire.pl.system.dependency.PLDependencies
uses com.guidewire.pl.system.gosu.entity.ScriptParameterPack

/**
 * Helps to find out the Server Environment
 * Created by tappetv on 3/03/2017.
 */
class EnvHelper {

  private construct(){
  }

 /**
  * Return true if server environment is Development
  */
  public static function isNotProductionEnvironment() : boolean {
    return PLDependencies.getServerMode().isDev() || PLDependencies.getServerMode().isTest()
  }

 /**
  * Get ScriptParameters list based on Env
  */
  public static function getScriptParameterPackByEnv() : ScriptParameterPack[] {
    if (isNotProductionEnvironment()) {
      return ScriptParameters.getParameterPacks()
    } else {
      return ScriptParameters.getParameterPacks().where(\sp -> ! sp.Name.startsWith("DEVOnly_"))
    }
  }

}