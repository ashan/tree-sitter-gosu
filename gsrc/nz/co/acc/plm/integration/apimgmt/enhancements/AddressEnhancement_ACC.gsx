package nz.co.acc.plm.integration.apimgmt.enhancements

/**
 * Address enhancements relevant to API management, but still useful in general.
 */
enhancement AddressEnhancement_ACC: Address {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:address"
  }
}
