package nz.co.acc.plm.integration.webservice.gxmodel

uses nz.co.acc.lob.util.ModifiersUtil_ACC
uses nz.co.acc.plm.integration.webservice.address.AddressData
uses nz.co.acc.plm.integration.webservice.address.CorrespondenceDetailsUtil

/**
 * Created by zhangji on 13/06/2017.
 */
enhancement PolicyPeriodEnhancement : PolicyPeriod {

  property get PolicyInvoiceAddress() : AddressData {
    return new CorrespondenceDetailsUtil().getCorrespondenceDetails(
        this.Policy.Account,
        getPolicyAddressType())
  }

  function getPolicyAddressType() : Optional<AddressPolicyType_ACC> {
    if (this.INDCoPLineExists || this.INDCPXLineExists) {
      return Optional.of(AddressPolicyType_ACC.TC_CPCPX)
    } else if (this.EMPWPCLineExists) {
      return Optional.of(AddressPolicyType_ACC.TC_WPC)
    } else if (this.CWPSLineExists) {
      return Optional.of(AddressPolicyType_ACC.TC_WPS)
    } else if (this.AEPLineExists) {
      return Optional.empty()
    }
    return Optional.empty()
  }

  property get ERRunNumber() : int {
    var modifiers = ModifiersUtil_ACC.getModifiers(this)
    return modifiers.where(\elt -> elt.Pattern.CodeIdentifier.endsWith("ExpRatingProgrammeRunNumber"))?.first()?.RateModifier?.intValue()
  }

}
