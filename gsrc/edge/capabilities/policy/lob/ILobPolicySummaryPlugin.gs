package edge.capabilities.policy.lob


/**
 * Plugin to access policy line summary information
 *
 */
interface ILobPolicySummaryPlugin {

  function getPolicyLineOverview(period : PolicyPeriod) : String



}
