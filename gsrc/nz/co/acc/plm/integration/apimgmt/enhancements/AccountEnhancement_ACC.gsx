package nz.co.acc.plm.integration.apimgmt.enhancements


/**
 * Account enhancements relevant to API management, but still useful in general.
 */
enhancement AccountEnhancement_ACC: Account {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:account"
  }

}
