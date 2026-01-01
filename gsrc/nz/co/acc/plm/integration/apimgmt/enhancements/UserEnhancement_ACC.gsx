package nz.co.acc.plm.integration.apimgmt.enhancements

/**
 * User enhancements relevant to API management, but still useful in general.
 */
enhancement UserEnhancement_ACC: User {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:user"
  }

}
