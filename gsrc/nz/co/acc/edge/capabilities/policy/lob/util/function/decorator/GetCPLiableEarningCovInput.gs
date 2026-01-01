package nz.co.acc.edge.capabilities.policy.lob.util.function.decorator

uses gw.lang.reflect.Expando

/**
 * @author ron.webb
 * @since 2019-08-29
 */
class GetCPLiableEarningCovInput {

  private var _cvrbl : INDCoPCov

  public construct(cvrbl : INDCoPCov) {
    this._cvrbl = cvrbl
  }

  public property get Dynamic() : Dynamic {
    var period = _cvrbl.Branch
    var basis : Dynamic = new Expando()

    basis.CeasedTrading_ACC = period.CeasedTrading_ACC
    basis.IsNewLERuleAppliedYear = period.IsNewLERuleAppliedYear
    basis.ActualLiableEarningsCov = _cvrbl.ActualLiableEarningsCov
    basis.LiableEarningCov = _cvrbl.LiableEarningCov

    return basis
  }

}