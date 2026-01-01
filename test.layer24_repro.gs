package com.gw

enhancement AsArrayOfEnhancementV10: Object {
  reified function asArrayOf<T>(type: Type<T>): T[] {
    return new T[0]
  }
}

class Validation {
  public static function getContext(propName : String) {
    // Feature literal with type list
    var x = ValidationFunctions#getContextValue(ContextAspect, String)
    foo( { 1, 2 } )
    var y = { 1, 2 }
  }
}
