package edge.webservice.pc.pc900.community

uses gw.xml.ws.annotation.WsiWebService
uses gw.xml.ws.annotation.WsiPermissions
uses gw.webservice.SOAPUtil
uses gw.api.database.Query
uses gw.webservice.pc.pc1000.community.datamodel.ProducerCodeDTO
uses edge.PlatformSupport.Logger


@WsiWebService("http://guidewire.com/pc/ws/gw/webservice/pc/pc900/community/EdgeProducerAPI")
@Export
class EdgeProducerAPI {

  private static final var LOGGER = new Logger(EdgeProducerAPI.Type.QName)

  /**
   * Returns the ProducerCodes with the given userName
   */
  @Param("username","the username the ProducerCodes are needed to return. Required to be non-<code>null</code>.")
  @Returns("The list of producerCodes")
  @WsiPermissions({SystemPermissionType.TC_PRODCODEVIEWBASIC})
  function getProducerCodesByUserName(userName : String) : List<ProducerCodeDTO> {
    SOAPUtil.require(userName, "userName")

    var c = new gw.product.ProducerCodeSearchCriteria(null, false, null, false)
    c.ProducerUser = findUserByCredential(userName)
    var producerCodes = new ArrayList<ProducerCodeDTO>()

    try {

      var results = c.performSearch()

      if(results?.HasElements){
        results.each( \ elt -> {

          var producerCodeDTO = new ProducerCodeDTO()
          producerCodeDTO.populateFromProducerCode(elt as ProducerCode)
          producerCodes.add(producerCodeDTO)
        })
      }
    } catch(e : Exception) {
      LOGGER.logWarn("No producer code found for user " + userName)
    }

    return producerCodes
  }

  protected function findUserByCredential(userName : String) : User {
    var q = Query.make(User)
    q.join("Credential").compare("UserName", Equals, userName)
    var results = q.select()
    return results.AtMostOneRow
  }

}
