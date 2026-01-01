enhancement EdgeArrayEnhancement<T> : T[] {
  reified function mapWithIndex<R>(mapper(item : T, idx : int) : R) : R[] {
    for (var elt in this index i) {
    }
  }
}

class Validation {
  // Feature literal with generics
  var requiredLength = Expr.call(ValidationFunctions#getFromMap(java.util.HashMap<Object,Object>,Object))
  
  // Map literal
  var codeMap = {
      CreditCardIssuer.TC_AMEX.Code -> 15
  }

  function testGenerics() {
      // Standalone generic call
      myGenericFunc<String>("test")
  }
}
