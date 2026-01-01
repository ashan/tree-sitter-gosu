package nz.co.acc.plm.integration.apimgmt.enhancements

uses entity.AccountContact

/**
 * AccountContactRole enhancements relevant to API management, but still useful in general.
 */
enhancement AccountContactRoleEnhancement_ACC: AccountContactRole {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:accountcontactrole"
  }

}
