package edge.capabilities.enrolment

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.path.Paths

/**
 * Platform-specific queries for the enrolment. There is a difference between Diamond, Emerald in Ferrite in the
 * query language. This class contains queries specific to the platform where the portal is deployed. It allows us to
 * share most of the enrollment code between different platforms.
 */
class EnrolmentQueries {
  /**
   * Returns a "latest" policy period for the given policy nubmber. Periods are compared based on their EndDate.
   * @param policyNumber policy number to find the latest policy period for.
   * @return latest policy period with the given policy number or <code>null</code> if there are no policy periods
   *   with the given policy number.
   */
  public static function getLatestPolicy(policyNumber : String) : PolicyPeriod {
    final var query = Query.make(PolicyPeriod).compare("PolicyNumber", Equals, policyNumber);
    final var policies = query.select().orderBy(QuerySelectColumns.path(Paths.make(PolicyPeriod#PeriodEnd)))
    return policies.FirstResult
  }
}
