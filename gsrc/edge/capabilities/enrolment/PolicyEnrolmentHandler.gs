package edge.capabilities.enrolment

uses java.lang.String
uses edge.jsonrpc.annotation.JsonRpcMethod
uses edge.capabilities.enrolment.dto.EnrolmentRequestDTO
uses gw.api.util.Logger
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler

/**
 * Handles the RPC request to do with a Policy Enrolment
 */
class PolicyEnrolmentHandler implements IRpcHandler {
  final private static var _logger = Logger.forCategory(PolicyEnrolmentHandler.Type.QName)
  

  @InjectableNode  
  construct(){
  }
  

  @JsonRpcMethod
  public function canEnrollPolicy(enrollmentData:EnrolmentRequestDTO):String  {
   enrollmentData.Details.eachKeyAndValue(\ k, v -> {
      _logger.debug("key: ${k}, value: ${v}")
    })

    final var policyNumber = enrollmentData.Details.get("policyNumber") as String
    _logger.info("Request to enroll policy number " + policyNumber)
    final var proposedPolicy = EnrolmentQueries.getLatestPolicy(policyNumber);

    if(proposedPolicy == null){
      _logger.debug("Requested policy number does not exist, denying enrollment")
      return null
    }
    
    final var enrollmentAddress = enrollmentData.Details.get("addressLine1")
       
    if(enrollmentAddress.NotBlank && !enrollmentAddress.equalsIgnoreCase(proposedPolicy.Policy.Account.AccountHolderContact.PrimaryAddress.AddressLine1)) {
      _logger.info("Primary address does not match address on file for enrollment request, denying enrollment")
      _logger.debug("Provided ${enrollmentAddress}, on file: ${proposedPolicy.Policy.Account.AccountHolderContact.PrimaryAddress.AddressLine1}")
      return null
    }
    
    return policyNumber
  }

}
