package nz.co.acc.plm.integration.apimgmt.enhancements

/**
 * Accreditation_ACC enhancements relevant to API management, but still useful in general.
 */
enhancement Accreditation_ACCEnhancement: Accreditation_ACC {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID(): String {
    return "${this.PublicID}:accreditation"
  }
}
