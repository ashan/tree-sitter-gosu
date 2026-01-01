//package com.gw
//uses java.lang.reflect.Array
//
///**
//* File created by Guidewire Upgrade Tools.
//*
//* Enhancement enables upgrade of unsupported array casts
//* ie. var as X[] becomes var?.asArrayOf(X)
//*/
//enhancement AsArrayOfEnhancement: Object {
//  function asArrayOf<T>(type: Type<T>): T[] {
//    if (this typeis T[]) {
//      return this as T[]
//    } else if (this.Class.isArray()) {
//      var result = new T[Array.getLength(this)]
//      for (i in 0..result.length - 1) {
//        result[i] = Array.get(this, i) as T
//      }
//      return result
//    } else if (this typeis Collection) {
//      return (this as Collection).toArray().cast(type)
//    } else {
//      return new T[]{this as T}
//    }
//  }
//}
package com.gw; enhancement AsArrayOfEnhancement : Object {}