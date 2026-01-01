package test.failures

// 1. Enums
enum Color {
  RED,
  GREEN,
  BLUE
}

enum Status {
  OPEN("Start"),
  CLOSED("End");

  var _desc : String
  construct(s : String) {
    _desc = s
  }
}

// 2. Typeis
function checkType(o : Object) {
  if (o typeis String) {
    print("String")
  }
  var x = o typeof String
}

// 3. Generics issues
class Container<T> {
  var _list : List<T>
  var _map : Map<String, List<T>>
}

// 4. Lambdas
var l1 = \ -> print("Empty")
var l2 = \ x : int -> x * 2

// 5. Modifiers
class Base {
  protected static property get Foo() : String { return "foo" }
  override function toString() : String { return "Base" }
}
