package test.generics_lambdas

uses java.util.ArrayList
uses java.util.concurrent.ConcurrentHashMap

class GenericsTest {
  function test() {
    // 1. New Generic
    var list = new ArrayList<String>()
    var map = new ConcurrentHashMap<String, Integer>()
    
    // 2. Nested Generics
    var nested = new ArrayList<ArrayList<String>>()
    
    // 3. Generic Method Call
    var x = Collections.emptyList<String>()
  }
}

class LambdaTest {
  function test() {
    var list = new ArrayList<String>()
    
    // 1. Simple Lambda
    list.map(\ x -> x.length)
    
    // 2. Typed Lambda
    list.map(\ x : String -> x.length)
    
    // 3. Multi-param
    var sum = \ a, b -> a + b
    
    // 4. Multi-param typed
    var sum2 = \ a : int, b : int -> a + b
    
    // 5. Block Lambda (from ActivityDashboard.gs)
    list.orderBy(\elt -> elt.GroupName + "-" + elt.JunoWork)
  }
}
