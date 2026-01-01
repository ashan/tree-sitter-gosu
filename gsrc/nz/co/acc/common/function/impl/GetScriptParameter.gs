package nz.co.acc.common.function.impl

uses java.util.function.Function

/**
 * @author Ron Webb
 * @since 2019-06-24
 */
class GetScriptParameter<TYPE_PARAM> implements Function<String, TYPE_PARAM> {

  protected var _default : TYPE_PARAM

  construct(defaultValue : TYPE_PARAM) {
    _default = defaultValue
  }

  construct() {
    this(null)
  }

  override function apply(paramName : String) : TYPE_PARAM {
    try {
      return ScriptParameters.getParameterValue(paramName) as TYPE_PARAM
    }
    catch(ex : Exception) {
      return _default
    }
  }
}