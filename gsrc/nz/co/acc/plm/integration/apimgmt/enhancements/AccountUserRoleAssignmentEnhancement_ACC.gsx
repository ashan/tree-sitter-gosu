package nz.co.acc.plm.integration.apimgmt.enhancements

/**
 * AccountUserRoleAssignment enhancements relevant to API management, but still useful in general.
 */
enhancement AccountUserRoleAssignmentEnhancement_ACC: AccountUserRoleAssignment {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:accountuserroleassignment"
  }

}
