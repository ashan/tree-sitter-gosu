package edge.capabilities.helpers

uses java.lang.IllegalArgumentException
uses edge.exception.EntityNotFoundException
uses edge.exception.EntityPermissionException
uses java.lang.Iterable
uses java.util.HashSet
uses edge.PlatformSupport.Reflection
uses edge.PlatformSupport.Logger
uses edge.di.annotations.ForAllGwNodes
uses edge.PlatformSupport.Bundle
uses gw.api.database.Query
uses gw.api.util.DateUtil

class PolicyUtil {

  final private static  var LOGGER = new Logger(Reflection.getRelativeName(PolicyUtil))
  final private static var MAXRECENTLYVIEWEDPOLICIES = 25

  @ForAllGwNodes
  construct(){}

  function getPolicyByPolicyNumber(aPolicyNumber: String): Policy {
    if (aPolicyNumber == null || aPolicyNumber.Empty){
      throw new IllegalArgumentException("Policy number is null or empty")
    }
    var aPolicy = Policy.finder.findPolicyByPolicyNumber(aPolicyNumber)

    if (aPolicy == null){
      throw new EntityNotFoundException(){
        : Message = "No Policy found",
        : Data = aPolicyNumber
      }
    }else if(!perm.PolicyPeriod.view(aPolicy.LatestPeriod)){
      throw new EntityPermissionException(){
        : Message = "User does not have permission to view the requested policy.",
        : Data = aPolicy
      }
    }

    return aPolicy
  }

  function getPoliciesByPolicyNumbers(policyNumbers: String[]): Policy[] {
    if (policyNumbers == null || policyNumbers.Count == 0){
      throw new IllegalArgumentException("Policy Numbers list is null or empty")
    }

    var policyPeriods = gw.api.database.Query.make(PolicyPeriod).compareIn("PolicyNumber",policyNumbers.where( \ policyNumber -> policyNumber != "Unassigned")).select()

    return filterPoliciesByViewPermission(policyPeriods)
  }

  /**
   * Returns the recently viewed policies in a Guidewire Portal for the given user
   */
  public function getRecentlyViewedPolicies(anUser : User) : Policy[]{
    if(anUser == null){
      throw new IllegalArgumentException("User must not be null")
    }
    LOGGER.logDebug("Finding recently viewed policies for user: " + anUser.DisplayName)
    var portalRecentlyViewed = gw.api.database.Query.make(PortalRecentlyViewed_Ext).compare("PortalUser", Equals, anUser).select().AtMostOneRow

    if(portalRecentlyViewed != null){
      return portalRecentlyViewed.PortalPolicies.sortByDescending(\ aPortalPolicy -> aPortalPolicy.ViewedDate)*.Policy
    }

    return null
  }

  /**
   * Returns the recently viewed policy in a Guidewire Portal for the given user
   */
  public function addRecentlyViewedPolicy(anUser : User, aPolicy : Policy){
    if(anUser == null){
      throw new IllegalArgumentException("User must not be null")
    }
    Bundle.transaction(\ bundle -> {
      LOGGER.logDebug("Adding recently viewed policy: " + aPolicy.LatestPeriod.PolicyNumber + " for user: " + anUser.DisplayName)
      var portalRecentlyViewed = bundle.add(gw.api.database.Query.make(PortalRecentlyViewed_Ext).compare("PortalUser", Equals, anUser).select().AtMostOneRow)

      if(portalRecentlyViewed == null){
        portalRecentlyViewed = new PortalRecentlyViewed_Ext()
        portalRecentlyViewed.PortalUser = anUser
      }

      // If the policy has already been recently viewed, update its view date
      if(portalRecentlyViewed.PortalPolicies != null && portalRecentlyViewed.PortalPolicies.hasMatch( \ aPortalPolicy -> aPortalPolicy.Policy == aPolicy)){
        var portalPolicy = portalRecentlyViewed.PortalPolicies.firstWhere( \ aPortalPolicy -> aPortalPolicy.Policy == aPolicy)
        portalPolicy.ViewedDate = gw.api.util.DateUtil.currentDate()
      }else{
        // If there are the maximum recently viewed policies, remove the policy that was view least recently
        if(portalRecentlyViewed.PortalPolicies.Count == MAXRECENTLYVIEWEDPOLICIES){
          var portalPolicies = portalRecentlyViewed.PortalPolicies.sortBy(\ aPortalPolicy -> aPortalPolicy.ViewedDate)
          portalPolicies[0].PortalRecentlyViewed = null
        }

        var portalPolicy = gw.api.database.Query.make(PortalPolicy_Ext).compare("Policy", Equals, aPolicy)
            .compare("PortalRecentlyViewed", Equals, portalRecentlyViewed).select().AtMostOneRow

        if(portalPolicy == null){
          portalPolicy = new PortalPolicy_Ext()
          portalPolicy.PortalRecentlyViewed = portalRecentlyViewed
          portalPolicy.Policy = aPolicy
          portalPolicy.ViewedDate = gw.api.util.DateUtil.currentDate()
        }
      }
    })

  }

  public function getRecentlyIssuedPolicies(numberOfDays :int) : Policy[]{
    var policies = getPoliciesForProducer(User.util.CurrentUser)

    return policies.where( \ policy -> policy.IssueDate.daysBetween(gw.api.util.DateUtil.currentDate()) <= 30)
  }

  public function getPoliciesForProducer(aUser : User) : Policy[]{
    var producerCodes = User.util.CurrentUser.UserProducerCodes*.ProducerCode
    var periodsSubquery = Query.make(PolicyPeriod)
        .compare("PeriodEnd", GreaterThanOrEquals, DateUtil.currentDate())
        .compare("MostRecentModel", Equals, true)
        .compare("Status", Equals, typekey.PolicyPeriodStatus.TC_BOUND)
        .compare("CancellationDate", Equals, null)
        .compareIn("ProducerCodeOfRecord", producerCodes)
    //find policies with a producercde of record that we want
    var policies = Query.make(Policy).or(\aQuery -> {
      aQuery.compareIn("ProducerCodeOfService", producerCodes)
      aQuery.subselect("ID", CompareIn, periodsSubquery, "Policy")
    }).withDistinct(true).select()

    return policies.where( \ aPolicy -> aPolicy.Issued && perm.PolicyPeriod.view(aPolicy.LatestPeriod)).toTypedArray()
  }

  /**
   * Filter a list of Policies and return an array of Policies the current user has permission to view
   */
  private function filterPoliciesByViewPermission(policyPeriods : Iterable<PolicyPeriod>) : Policy[]{
    // Use a HashSet to ensure only unique Policies are returned
    var filteredPolicies : HashSet<Policy> = new HashSet<Policy>()
    if(policyPeriods != null && policyPeriods.HasElements){
      policyPeriods.each( \ pp -> {
        if(perm.PolicyPeriod.view(pp)){
          filteredPolicies.add(pp.Policy)
        }
      })

      if(filteredPolicies.Count < policyPeriods.Count){
        LOGGER.logWarn("User does not have permission to view some or all policies found and they have been removed from the returned list.")
        if(filteredPolicies.Empty){
          throw new EntityPermissionException(){
              : Message = "User does not have permission to view the requested policies.",
              : Data = policyPeriods
          }
        }
      }
    }else{
      throw new EntityNotFoundException(){
          : Message = "No Policies found",
          : Data = filteredPolicies
      }
    }

    return filteredPolicies.toTypedArray()
  }

}
