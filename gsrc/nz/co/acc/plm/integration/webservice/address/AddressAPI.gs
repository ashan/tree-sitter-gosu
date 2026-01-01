package nz.co.acc.plm.integration.webservice.address

uses gw.api.gx.GXOptions
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.RequiredFieldException
uses gw.api.webservice.exception.SOAPException
uses gw.webservice.SOAPUtil
uses gw.xml.ws.annotation.WsiPermissions
uses gw.xml.ws.annotation.WsiWebService
uses nz.co.acc.plm.integration.webservice.gxmodel.addressdatamodel.AddressData

/**
 * Created by zhangji on 7/06/2017.
 */
@WsiWebService("http://acc.co.nz/pc/ws/nz/co/acc/plm/integration/webservice/address/AddressAPI")
@Export
class AddressAPI {
  var _correspondenceDetailsUtil = new CorrespondenceDetailsUtil()

  /**
   * This method performs the search against contact Address stored
   * in PolicyCenter.
   *
   * @param policyNumber The number of the policy to be found
   * @param asOfDate     A date on which the policy to find is in effect.
   * @return String that holds the public ID of the most recent policy period associated with policy
   * number <code>policyNumber</code> that was in effect on or after <code>asOfDate</code>,
   * or <code>null</code> if there is no such policy period. Warning: The policy period returned
   * might be archived. This status will not be signaled by this method.
   */
  @Throws(SOAPException, "If communication errors occur")
  @Throws(RequiredFieldException, "If required field is missing")
  @Throws(BadIdentifierException, "If cannot find entity with given identifier")
  @Param("accountNumber", "The number of the Account to be found")
  @Param("policyAddressType", "The address policy type")
  @WsiPermissions({SystemPermissionType.TC_SEARCHPOLS})
  @Returns("the gxmodel type instance of valid address found, or null if no valid address found")
  function getAccountAddress(accountNumber : String, policyAddressType : String) : nz.co.acc.plm.integration.webservice.gxmodel.addressdatamodel.types.complex.AddressData {
    SOAPUtil.require(accountNumber, "accountNumber")

    var _gxOpts = new GXOptions()
    _gxOpts.Incremental = false
    _gxOpts.Verbose = false
    _gxOpts.SuppressExceptions = false

    var toReturn : nz.co.acc.plm.integration.webservice.gxmodel.addressdatamodel.types.complex.AddressData = null
    var address = _correspondenceDetailsUtil.getCorrespondenceDetails(accountNumber, policyAddressType)
    toReturn = new AddressData(address, _gxOpts).$TypeInstance
    return toReturn
  }


}
