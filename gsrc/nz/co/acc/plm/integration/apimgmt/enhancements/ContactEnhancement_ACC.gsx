package nz.co.acc.plm.integration.apimgmt.enhancements

uses entity.Contact

/**
 * Contact enhancements relevant to API management, but still useful in general.
 */
enhancement ContactEnhancement_ACC : Contact {

  /**
   * Returns the globally unique id of the entity instance.
   *
   * @return globally unique id
   */
  function getLinkID() : String {
    return "${this.PublicID}:contact"
  }

  function isProductAddressFieldSet(productCode : String) : boolean {
    if (productCode.equals("IndividualACC") and this.CPCPXAddress_ACC != null and this.AllAddresses.contains(this.CPCPXAddress_ACC)) {
      return true
    } else if (productCode.equals("EmployerACC") and this.WPCAddress_ACC != null and this.AllAddresses.contains(this.WPCAddress_ACC)) {
      return true
    } else if (productCode.equals("ShareholdingCompany") and this.WPSAddress_ACC != null and this.AllAddresses.contains(this.WPSAddress_ACC)) {
      return true
    }
    return false
  }

  property get IsEmailVerified() : Boolean {
    return this.EmailVerifiedDate_ACC != null
  }

  property set IsEmailVerified(isVerified : Boolean) {
    if (isVerified) {
      this.EmailVerifiedDate_ACC = Date.CurrentDate;
    } else {
      this.EmailVerifiedDate_ACC = null
    }
  }

  property get IsClaimsEmailVerified() : Boolean {
    return this.ClaimsEmailVerifiedDate_ACC != null
  }

  property set IsClaimsEmailVerified(isVerified : Boolean) {
    if (isVerified) {
      this.ClaimsEmailVerifiedDate_ACC = Date.CurrentDate;
    } else {
      this.ClaimsEmailVerifiedDate_ACC = null
    }
  }

  property get IREmailVerified_ACC() : String {
    return this.IREmailVerifiedStatus_ACC == Boolean.FALSE ? null : this.IREmailAddress
  }

  property get IRCelPhoneVerified_ACC() : String {
    return this.IRPhoneVerifiedStatus_ACC == Boolean.FALSE ? null : this.IRCellPhone_ACC
  }

  function irEmailValidUntil() {
    if(this.IREmailVerifiedStatus_ACC == Boolean.FALSE) {
      this.IREmailValidUntil_ACC = Date.Now
    } else {
      this.IREmailValidUntil_ACC = null
    }
  }

  function irPhoneValidUntil() {
    if(this.IRPhoneVerifiedStatus_ACC == Boolean.FALSE) {
      this.IRPhoneValidUntil_ACC = Date.Now
    } else {
      this.IRPhoneValidUntil_ACC = null
    }
  }
}
