package nz.co.acc.plm.address

enhancement AddressEnhancement_ACC: Address {

  property get IsGNA(): Boolean {
    return this.ValidUntil != null
  }
}
