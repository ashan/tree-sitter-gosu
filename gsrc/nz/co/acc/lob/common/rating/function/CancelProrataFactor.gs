package nz.co.acc.lob.common.rating.function

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.math.BigDecimal
uses java.util.function.Function

/**
 * Ignores any prorate factor and just return BigDecimal.ONE.
 *
 * @author Ron Webb
 * @since 2019-07-08
 */
class CancelProrataFactor implements Function<BigDecimal, BigDecimal> {

  private static final var LOG = StructuredLogger.CONFIG.withClass(CancelProrataFactor)

  override function apply(prorataFactor : BigDecimal) : BigDecimal {
      var returnValue = BigDecimal.ONE
      LOG.debug("Ignoring the prorataFactor ${prorataFactor} and instead return ${returnValue}")
      return returnValue
  }
}