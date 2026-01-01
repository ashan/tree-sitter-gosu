package edge.capabilities.quote.session

uses gw.processes.BatchProcessBase
uses edge.PlatformSupport.Bundle
uses gw.api.database.Query
uses edge.PlatformSupport.Logger
uses edge.PlatformSupport.Reflection
uses gw.api.util.DateUtil
uses java.lang.Exception
uses edge.util.helper.SessionExpirationUtil
uses java.lang.Integer

class QuoteSessionCleanupBatchProcess extends BatchProcessBase {

  final private static var _logger = new Logger(Reflection.getRelativeName(QuoteSessionCleanupBatchProcess))

  final public static var EXPIRATION_PROPERTY : String = "quotesession_hours"


  construct() {
    super(BatchProcessType.TC_PORTALQUOTESESSION_MPEXT)
  }

  override function doWork() {
    // We are invalidating and retiring things that have expired in the past hour
    var expirationTimeHours = SessionExpirationUtil.getSessionExpirationForProperty(EXPIRATION_PROPERTY)
    var expiryCutOff = DateUtil.currentDate().addHours(-expirationTimeHours)

    var sessions = Query.make(PortalSession_MPExt).compare("sessionType", Equals, "Submission").compare("issueDate", LessThan, expiryCutOff).select()

    this.OperationsExpected = sessions.Count
    _logger.logDebug("The number of modified addresses is: " + sessions.Count)

    for (sess in sessions) {
      try {
        Bundle.transaction(\ bundle -> {
          var toRemove = bundle.PlatformBundle.loadByPublicId(PortalSession_MPExt, sess.PublicID)
          bundle.delete(toRemove)
          incrementOperationsCompleted()
        }, "sys")
      } catch (e : Exception) {
        incrementOperationsFailed()
        _logger.logWarn(e)
        _logger.logWarn("Error attempting to delete portal session: " + e)
      }
    }
  }

  /**
   * Only allow one instance of this BatchProcess to run at a time
   *  - to avoid duplicate transactions being commited.
   */
  override property get Exclusive() : boolean {
    return true
  }

  /**
   * This batch process currently ignores the Termination Request.
   * To support it we need to check the TerminateRequested property
   * and return true from this function.
   */
  override function requestTermination() : boolean {
    return false
  }

}
