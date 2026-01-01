package nz.co.acc.gwer.enhancement

enhancement ERClaimCostTransferEnhancement : ERClaimCostTransfer_ACC {

  property get ACCNumber() : String {
    if (this.ACCPolicyID.HasContent) {
      return this.ACCPolicyID.substring(0, this.ACCPolicyID.length - 1)
    }
    return null
  }
}
