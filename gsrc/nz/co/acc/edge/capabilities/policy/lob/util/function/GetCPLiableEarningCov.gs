package nz.co.acc.edge.capabilities.policy.lob.util.function

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.util.function.Function

/**
 * @author ron.webb
 * @since 2019-08-29
 */
class GetCPLiableEarningCov implements Function<Dynamic, Dynamic> {

  private static final var LOG = StructuredLogger.INTEGRATION.withClass(GetCPLiableEarningCov)

  override function apply(dynamic : Dynamic) : Dynamic {

    var isCeasedTrading : Boolean = dynamic.CeasedTrading_ACC
    var isNewLERuleAppliedYear : Boolean = dynamic.IsNewLERuleAppliedYear
    var actualLiableEarningsCov = dynamic.ActualLiableEarningsCov
    var liableEarningCov = dynamic.LiableEarningCov

    LOG.debug("isNewLERuleAppliedYear: " + isNewLERuleAppliedYear)

    var useActual = (isNewLERuleAppliedYear || (isCeasedTrading && !isNewLERuleAppliedYear))

    LOG.debug("useActual: " + useActual)

    var correctCov = (useActual ? actualLiableEarningsCov : liableEarningCov)

    return correctCov
  }
}