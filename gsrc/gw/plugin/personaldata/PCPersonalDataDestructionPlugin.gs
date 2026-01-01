package gw.plugin.personaldata

uses com.google.common.collect.Lists
uses entity.Contact
uses gw.api.database.Queries
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.domain.PinnableHierarchyModel
uses gw.api.domain.personaldata.PCPersonalDataDestroyer
uses gw.api.domain.personaldata.PinnablePersonalDataDestroyer
uses gw.api.util.PCDeleteBuilder
uses gw.losshistory.ClaimSearchCriteria
uses gw.personaldata.purge.RemoveOrphanedAccountContactAndAccountContactRoleVisitor
uses gw.personaldata.purge.RemoveOrphanedEntitiesVisitor
uses gw.personaldata.purge.RemoveOrphanedLinkedAddressVisitor
uses gw.pl.persistence.core.Bundle
uses gw.plugin.Plugins
uses gw.plugin.claimsearch.ClaimSearchSpec
uses gw.plugin.claimsearch.IClaimSearchPlugin
uses gw.plugin.claimsearch.NoResultsClaimSearchException

@Export
class PCPersonalDataDestructionPlugin extends AbstractPersonalDataDestructionPlugin {

  override function shouldDestroyPolicyTerm(policyTerm: PolicyTerm, descendants: Collection<DestructionRootPinnable>,
                                            origin: DestructionRootPinnable): PersonalDataDisposition {
    if (policyTerm.isRetired()) {
      return MUST_DESTROY
    }

    /**
     * MUST_NOT destroy if there are any open activities against the policy.
     * We are assuming that old activities will get purged by cleanup batch process(es).
     */
    if (policyTerm.Policy.AllOpenActivities.iterator().hasNext()) {
      return MUST_NOT_DESTROY
    }

    /**
     * MUST_NOT destroy if there are any open jobs against the policy.
     * We are assuming that old jobs will get purged by cleanup batch process(es).
     */
    if (policyTerm.isBound()) {
      if (policyTerm.Policy.OpenJobs.length > 0) {
        return MUST_NOT_DESTROY
      }
    } else {
      // > 1 since the unbound submission would itself also be open.
      if (policyTerm.Policy.OpenJobs.length > 1) {
        return MUST_NOT_DESTROY
      }
    }

    /**
     * If there are any open claims against the policy then the policy term MUST_NOT be destroyed.
     */
    if (Plugins.isEnabled(IClaimSearchPlugin)) {
      var claimSearchCriteria = new ClaimSearchCriteria() {
        construct() {
          super.Policy = policyTerm.Policy
        }

        override property get SearchSpecs(): List<ClaimSearchSpec> {
          var specs = super.SearchSpecs
          specs.each(\spec -> {spec.ClaimStatus = "Open"})
          return specs
        }
      }

      var claimSearchException: Exception = null
      var openClaims: ClaimSet
      try {
        openClaims = claimSearchCriteria.performSearch()
      } catch (ex: Exception) {
        claimSearchException = ex
      }

      if (claimSearchException != null and  not (claimSearchException typeis NoResultsClaimSearchException)) {
        return MUST_NOT_DESTROY
      }

      if (openClaims != null and not openClaims.Claims.IsEmpty) {
        return MUST_NOT_DESTROY
      }
    }

    /**
     * If the policy is not bound and the coverage end date is more than 13months in the past it is MAY_DESTROY.
     */
    if (!policyTerm.isBound()) {
      var periods = policyTerm.Policy.Periods
      var coverageEndDate = periods*.EndOfCoverageDate.sort().last()
      if (coverageEndDate.addMonths(13) < Date.Today) {
        return MAY_DESTROY
      } else {
        return MUST_NOT_DESTROY
      }
    }

    /**
     * The policy ended more than 10years ago, so it MUST be destroyed.
     */
    var policyTermEndDate = policyTerm.findMostRecentPeriod().getCoverageEndDate()
    if (policyTermEndDate.addYears(10) < Date.Today) {
      return MUST_DESTROY
    }

    /**
     * If its a PersonalAuto policy and ended more than 3years ago it MAY be destroyed.
     */
    var lobs = policyTerm.Periods*.Lines
    if (lobs.allMatch(\elt -> elt typeis entity.PersonalAutoLine) and policyTermEndDate.addYears(3) < Date.Today) {
      return MAY_DESTROY
    }

    return MUST_NOT_DESTROY
  }

  override function shouldDestroyPolicy(policy: Policy, descendants: Collection<DestructionRootPinnable>,
                                        origin: DestructionRootPinnable): PersonalDataDisposition {
    if (policy.isRetired()) {
      return MUST_DESTROY
    }

    /**
     * MUST_NOT destroy if there are any open activities against this policy
     * We are assuming that old activities will get purged by cleanup batch process(es).
     */
    if (policy.AllOpenActivities.HasElements) {
      return MUST_NOT_DESTROY
    }

    var policyTerms = policy.Periods*.PolicyTerm.toSet()
    var dispositions = policyTerms.map(\ policyTerm ->
        shouldDestroyPolicyTerm(policyTerm, policyTerm.getPinnableDescendants(), origin))

    if (dispositions.hasMatch(\elt -> elt == PersonalDataDisposition.MUST_NOT_DESTROY)) {
      return MUST_NOT_DESTROY
    }

    if (dispositions.hasMatch(\elt -> elt == PersonalDataDisposition.MUST_DESTROY)) {
      // All the others must be MUST_DESTROY or MAY_DESTROY
      return MUST_DESTROY
    }

    // All dispositions must be MAY_DESTROY as no MUST_NOT_DESTROY, or MUST_DESTOY
    return MAY_DESTROY
  }

  override function shouldDestroyAccount(account: Account, descendants: Collection<DestructionRootPinnable>,
                                         origin: DestructionRootPinnable): PersonalDataDisposition {
    if (account.isRetired()) {
      return MUST_DESTROY
    }

    if (account.AccountStatus == AccountStatus.TC_WITHDRAWN) {
      /**
       * If account was withdrawn more than 3years ago, then MUST_DESTROY
       */
      if (account.AccountStatusUpdateTime.addYears(3) < Date.Today) {
        return MUST_DESTROY
      }

      var policies = account.Policies
      if (policies.IsEmpty) {
        return MAY_DESTROY
      }

      /**
       * Check if there are policies associated with this account that MUST_NOT be destroyed.
       */
      if (policies.hasMatch(\policy ->
          shouldDestroyPolicy(policy, policy.getPinnableDescendants(), origin) == MUST_NOT_DESTROY)) {
        // At least one policy that MUST_NOT be destroyed. Therefore this account MUST_NOT be destroyed either.
        return MUST_NOT_DESTROY
      }

      /**
       * If all policies are MUST_DESTROY, then MUST_DESTROY
       */
      if (policies.allMatch(\policy ->
          shouldDestroyPolicy(policy, policy.getPinnableDescendants(), origin) == MUST_DESTROY)) {
        return MUST_DESTROY
      }

      return MAY_DESTROY
    }

    return MUST_NOT_DESTROY
  }

  override function shouldDestroyContact(contact: Contact, descendants: Collection<DestructionRootPinnable>,
                                         origin: DestructionRootPinnable): PersonalDataDisposition {
    if (contact.isRetired()) {
      return MUST_DESTROY
    }

    if (contact typeis Company or contact typeis CompanyVendor or contact typeis Place or contact typeis LegalVenue) {
      return MUST_NOT_DESTROY
    }

    var query = Query.make(AccountContact)
    query.compare(AccountContact#Contact, Relop.Equals, contact.ID)
    var results = query.select()

    if (results.isEmpty()) {
      return MUST_DESTROY
    }

    var accounts = results.map(\elt -> elt.Account)

    if (accounts.allMatch(\elt -> shouldDestroyAccount(elt, elt.getPinnableDescendants(), origin) == MUST_DESTROY )) {
      return MUST_DESTROY
    }

    if (accounts.allMatch(\elt -> shouldDestroyAccount(elt, elt.getPinnableDescendants(), origin) == MAY_DESTROY)) {
      return MAY_DESTROY
    }

    if (accounts.allMatch(\elt -> shouldDestroyAccount(elt, elt.getPinnableDescendants(), origin) == MUST_DESTROY or
        shouldDestroyAccount(elt, elt.getPinnableDescendants(), origin) == MAY_DESTROY)) {
      return MUST_DESTROY
    }

    return MUST_NOT_DESTROY
  }

  override property get Destroyer(): PinnablePersonalDataDestroyer {
    return new PCPersonalDataDestroyer()
  }

  override function shouldDestroyUser(userContact: UserContact): PersonalDataDisposition {
    return MUST_NOT_DESTROY
  }

  override function notifyDataProtectionOfficer(root: DestructionRootPinnable, title: String, message: String, errorOccurred: Date) {
    root.accept(new NotifyDataProtectionOfficerVisitor(title, message, errorOccurred))
  }

  override function notifyExternalSystemsRequestProcessed(requester : PersonalDataDestructionRequester) {
    //To notify the external system from which the request to purge the Contact with the given AddressBookUID originated
  }

  override function createContext(context : PersonalDataPurgeContext) : PersonalDataPurgeContext {
    /* just return the specified context, or return a subclass instance
     * created from the specified context...
     */
    return new ExtendedContext(context)
  }

  override function prepareForPurge(context : PersonalDataPurgeContext) {
    /*
     * Perform any actions prior to purge such as logging or gathering statistics.
     * Guidewire performs some cleanup for PolicyPeriod links before purging.
     */
    if (context typeis ExtendedContext) {
      var model = new PinnableHierarchyModel(context.Pinnable)
      model.accept(context.Visitor)
    }
  }

  override function postPurge(context : PersonalDataPurgeContext) {
    /*
     * Perform any actions post-purge such as clean-up
     * or notification of external systems
     * Other than logging or gathering statistics, Guidewire strongly recommends against any business critical task being performed
     * in this method.
     */
    if (context typeis ExtendedContext) {
      var orphanedEntities: Collection<KeyableBean>
      gw.transaction.Transaction.runWithNewBundle(\ bundle -> {
        orphanedEntities = context.Visitor.postPurge(bundle)
      })

      deleteOrphanEntities(orphanedEntities)
    }
  }

  private function deleteOrphanEntities(orphans: Collection<KeyableBean>) {
    orphans.each(\ orphan -> {
      var type = orphan.IntrinsicType
      var query = Queries.createQuery(type)
      query.withFindRetired(true)
          .withLogSQL(true)
          .compare(KeyableBean.ID_DYNPROP.get(type), Equals, orphan.ID)
      new PCDeleteBuilder().executeDelete(query)
    })
  }

  /**
   * Extended PurgeContext. Modify to add customer-specific information
   * that will be passed from the pre-purge to the post-purge extension.
   */
  static class ExtendedContext extends PersonalDataPurgeContext {
    var _visitor : CompositeVisitor as readonly Visitor

    construct(ctx : PersonalDataPurgeContext) {
      super(ctx)
      _visitor = new CompositeVisitor()
      _visitor.addVisitor(new RemoveOrphanedAccountContactAndAccountContactRoleVisitor())
      _visitor.addVisitor(new RemoveOrphanedLinkedAddressVisitor())
    }
  }

  private static class CompositeVisitor implements RemoveOrphanedEntitiesVisitor {
    var _visitors : List<RemoveOrphanedEntitiesVisitor>

    construct() {
      _visitors = new ArrayList<RemoveOrphanedEntitiesVisitor>()
    }

    function addVisitor(visitor : RemoveOrphanedEntitiesVisitor) {
      _visitors.add(visitor)
    }

    function postPurge(bundle: Bundle): Collection<KeyableBean> {
      var orphanedEntities = Lists.newArrayList<KeyableBean>()
      _visitors.each(\elt -> orphanedEntities.addAll(elt.postPurge(bundle)))
      return orphanedEntities
    }

    override function visit(contact : Contact) {
      _visitors.each(\elt -> elt.visit(contact))
    }

    override function visit(account : Account) {
      _visitors.each(\elt -> elt.visit(account))
    }

    override function visit(policy : Policy) {
      _visitors.each(\elt -> elt.visit(policy))
    }

    override function visit(policyTerm : PolicyTerm) {
      _visitors.each(\elt -> elt.visit(policyTerm))
    }

    override function visit(period : PolicyPeriod) {
      _visitors.each(\elt -> elt.visit(period))
    }
  }
}