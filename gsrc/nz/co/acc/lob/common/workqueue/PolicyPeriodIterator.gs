package nz.co.acc.lob.common.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Key

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.lang.invoke.MethodHandles

/**
 * Lazily fetches PolicyPeriod entities for a specified iterator of PolicyPeriod IDs.
 * <p>
 * Created by OurednM on 14/11/2018.
 */
class PolicyPeriodIterator implements Iterator<PolicyPeriod> {
  private var _policyPeriodIds: Iterator<Long>
  private static final var _logger = StructuredLogger.CONFIG.withClass(MethodHandles.lookup().lookupClass())
  construct(policyPeriodIds: Iterator<Long>) {
    this._policyPeriodIds = policyPeriodIds
  }

  override function hasNext(): boolean {
    return _policyPeriodIds.hasNext()
  }

  override function next(): PolicyPeriod {
    var policyPeriodId = new Key(PolicyPeriod, _policyPeriodIds.next())
    logInfo("next", "Fetching PolicyPeriod (id=${policyPeriodId})")
    return Query.make(PolicyPeriod)
        .compare(PolicyPeriod#ID, Relop.Equals, policyPeriodId)
        .select()
        .FirstResult
  }

  private function logInfo(fn: String, msg: String) {
_logger.info(msg)
  }
}