package edge.samlV2.base.plugins

uses java.util.Map
uses java.util.ArrayList
uses org.apache.commons.lang.StringUtils
uses gw.pl.exception.GWConfigurationException

class BasePluginImpl {

  construct() {

  }

  /**
   * This is a helper function for plugin parameter handling,  it pulls a value from a cast version of the parameters map, defaults the value with
   * what ever default is provided (pass null if no default value) and then if both the config and the default are null, throws an exception if
   * the code has been written requesting the exception for a required parameter
   *
   * @param params Plugin configuration map that has been cast to the proper type prior to calling this function
   * @param requestKay The key that we will check for in the parmas map to load the configuration value
   * @param defaultValue The value that will be used as a default when there is no value found in the configuration map
   * @param throwExceptionIfValueNull Flag saying we should throw an exception if a value is is null after load and defaulting
   */
  public function getValueOrDefault(params:Map<String, String>, requestKey:String, defaultValue:String, throwExceptionIfRequestedAndValueNull:boolean):String {
    if(params != null) {
      var value:String = params.get(requestKey)

      value = (StringUtils.isBlank(value)) ? defaultValue : value

      if(StringUtils.isBlank(value) && throwExceptionIfRequestedAndValueNull) {
        throw new GWConfigurationException("Required parameter with key [${requestKey}] not found in parameters,  exception thrown as requested by code")
      }
      return value
    } else if (throwExceptionIfRequestedAndValueNull) {
      throw new GWConfigurationException("Parameters map is required to extract a value, exception thrown as requested by code")
    }
    return null
  }

  /**
   * This is a helper function to help with splitting comma separated strings into a list of individual elements. Useful for splitting a CSV list from a properties file into a usable list
   *
   * @param input The list in CSV format
   * @retrun List<String> A list containing the individual elements of the provided input string
   */
  public function splitAndTrimCSVString(input:String):List<String> {
    var el = new ArrayList<String>()

    if(StringUtils.isNotBlank(input)) {
      var individuals = input.split(",")

      for(indiv in individuals) {
        indiv = StringUtils.strip(indiv)
        el.add(indiv.toLowerCase())
      }
    }

    return el
  }
}
