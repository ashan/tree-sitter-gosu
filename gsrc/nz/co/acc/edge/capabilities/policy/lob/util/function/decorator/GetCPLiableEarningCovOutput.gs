package nz.co.acc.edge.capabilities.policy.lob.util.function.decorator

/**
 * @author ron.webb
 * @since 2019-08-29
 */
class GetCPLiableEarningCovOutput {

  private var _dynamic : Optional<Dynamic>

  public construct(dynamic : Dynamic) {
    this._dynamic = Optional.ofNullable(dynamic)
  }

  public property get ActualType() : Optional<INDLiableEarnings_ACC> {
    var output : Optional<INDLiableEarnings_ACC>

    if (_dynamic.isPresent()) {
      output = Optional.of(_dynamic.get() as INDLiableEarnings_ACC)
    }

    return output
  }

}