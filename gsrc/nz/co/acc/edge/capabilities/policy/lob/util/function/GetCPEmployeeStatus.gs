package nz.co.acc.edge.capabilities.policy.lob.util.function

uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.function.Funxion

uses java.util.function.Function

/**
 * @author ron.webb
 * @since 2019-08-14
 */
class GetCPEmployeeStatus implements Function<Dynamic, Boolean> {

  private static final var LOG = StructuredLogger.INTEGRATION.withClass(GetCPEmployeeStatus)

  override function apply(dynamic : Dynamic) : Boolean {

    var correctCov = Funxion.buildProcessor(new GetCPLiableEarningCov()).process(dynamic)
    var isFulltime = correctCov.FullTime

    LOG.debug("isFulltime: " + isFulltime)

    return isFulltime
  }
}