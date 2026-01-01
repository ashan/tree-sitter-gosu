package nz.co.acc.plm.integration.apimgmt.enhancements

uses gw.api.database.Query

/**
 * AccountContact enhancements relevant to API management, but still useful in general.
 */
enhancement AccountContactEnhancement_ACC: AccountContact {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:accountcontact"
  }

  /**
   * Returns the latest bound (submissions), completed or revised (audit periods) policy summaries per Policy
   * that the contact is associated with.
   * @return gw.api.database.IQueryBeanResult<entity.PolicyPeriodSummary>
   */
  property get AssociatedPolicies_ACC() : gw.api.database.IQueryBeanResult<entity.PolicyPeriodSummary> {
    var polSummaryQuery = Query.make(PolicyPeriodSummary)

    // Filter for completed Or bound periods
    .or(
        \orCriteria -> {
          orCriteria.compare("Status", Equals, PolicyPeriodStatus.TC_AUDITCOMPLETE)
          orCriteria.compare("Status", Equals, PolicyPeriodStatus.TC_BOUND)
        }
    )

    // Fetch policies that are related to the contact
    var policyContactRoleTable = polSummaryQuery.join(PolicyContactRole, "BranchValue")
    policyContactRoleTable.compare("ContactDenorm", Equals, this.Contact)

    return polSummaryQuery.select()
  }

  property get Primary_ACC() : Boolean {
    if(this.Account.PrimaryAccountContactID_ACC != null) {
      return this?.Account?.PrimaryAccountContactID_ACC == this?.ID?.Value
    }

    return this.Account.AccountHolderContact == this.Contact
  }

  property get CanEditContactInfo_ACC() : Boolean {
    return this.Contact == this.Account.AccountHolderContact or this.Contact.AccountHolderCount == 0
  }

  function getDisplayRoles_ACC(separator : String = ", ") : String {
    return this.Roles.toList().join(separator)
  }
}
