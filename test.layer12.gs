class Layer12Repro {
  var x = this
  var y = this.foo
  
  construct() {
    this(1)
    super()
  }

  function test() {
    var l1 = \ x -> x + 1
    var l2 = \ x : int -> x + 1
    var l3 = \ -> 1
    
    @Servlet(\ path -> path.matches("/dms"))
    var z : int
  }
}
