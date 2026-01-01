package nz.co.acc.plm.integration.ir.util

uses java.lang.Exception
uses java.lang.invoke.MethodHandles

uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger


/**
 *  Helper class for bundle/transaction
 */
class BundleHelper {
  private static final var _logger = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())
  /**
   * Constructor
   */
  private construct() {}

  /**
   * Add bean to current bundle and refresh if required
   */
  public static reified function explicitlyAddBeanToBundle<T extends KeyableBean>(kb : T, doRefresh : boolean) : T {
    return explicitlyAddBeanToBundle(gw.transaction.Transaction.getCurrent(), kb, doRefresh)
  }


  /**
   * Add bean to given bundle and refresh if required
   */
  public static reified function explicitlyAddBeanToBundle<T extends KeyableBean>(bundle : Bundle, kb : T, doRefresh : boolean) : T {
    var fn = "explicitlyAddBeanToBundle"
    try {
      if (doRefresh) {
        kb = kb.refresh() as T
      }
      return bundle.add(kb)
    } catch(e : Exception) {
      _logger.error_ACC("[${kb.DisplayName}] is already in Bundle - cannot add", e)
      return kb
    }
  }

}