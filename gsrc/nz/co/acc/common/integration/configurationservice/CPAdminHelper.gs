package nz.co.acc.common.integration.configurationservice

uses com.guidewire.pl.system.dependency.PLDependencies
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

/**
 * Helper for the Internal Tools > Configuration Properties view. See {@code ConfigurationProperties.pcf).
 */
class CPAdminHelper {

  /**
   * @return Absolute path of the properties file. Empty if {@code getStatus()} returns false.
   */
  function getSource(): String {
    return ConfigurationPropertyLoader.Singleton.SourceFile.getAbsolutePath()
  }

  /**
   * Details of all the properties needs to be displayed on the UI.
   *
   * @return list of property data
   */
  function getPropertiesList(): ConfigurationProperty[] {

     if(PLDependencies.getServerMode().isDev()) {
      return ConfigurationProperty.AllValues.toTypedArray()
    }else{
      return ConfigurationProperty.AllValues.toTypedArray().where(\elt -> !elt.Name.startsWith("EXAMPLE"))
    }
  }

  /**
   * The resulting status of the property loading process.
   *
   * @return {@code true} if properties were loaded from the file successfully.
   */
  function getStatus(): boolean {
    return ConfigurationPropertyLoader.Singleton.IsInitialised
  }

}
