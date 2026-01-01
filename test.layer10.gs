package test.layer10

uses java.util.List

class FieldAsPropertyTest {
  // 1. Standard
  var _name : String as Name
  
  // 2. Readonly
  var _id : String as readonly Id
  
  // 3. Modifiers (public is default for property but maybe specified?)
  private var _secret : String as internal Secret
}

class NestedGenericsTest {
  function test() {
     // 1. Double closing bracket
     var x : List<List<String>>
  }
}

enhancement MyEnhancement : String {
   function printMe() {
     print(this)
   }
}
