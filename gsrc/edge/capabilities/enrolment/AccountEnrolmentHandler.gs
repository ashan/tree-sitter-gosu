package edge.capabilities.enrolment

uses edge.capabilities.enrolment.dto.EnrolmentRequestDTO
uses gw.api.util.Logger
uses edge.di.annotations.InjectableNode
uses edge.jsonrpc.IRpcHandler
uses edge.jsonrpc.annotation.JsonRpcMethod
uses java.lang.Exception
uses java.util.Date
uses java.text.SimpleDateFormat

/**
 * Handles the RPC request to do with a Policy Enrolment
 */
class AccountEnrolmentHandler implements IRpcHandler {
  final private static var _logger = Logger.forCategory(AccountEnrolmentHandler.Type.QName)
  final private static var _dateFormatter = new SimpleDateFormat('yyyy-MM-dd')

  @InjectableNode
  construct() {
  }

  /**
   * Determines if an account can be enrolled given details relating to that account.
   *
   * <dl>
   *   <dt>Throws:</dt>
   *   <dd><code>Exception</code> - if an account number was not provided
   * </dl>
   *
   * @param enrollmentData details relating to an account such as a policy number belonging to the account and the email address
   * of the account
   * @returns true if the account can be enrolled or null otherwise
   */
  @JsonRpcMethod
  public function canEnrollAccount(enrollmentData: EnrolmentRequestDTO): String {
    enrollmentData.Details.eachKeyAndValue(\k, v -> {
      _logger.debug("key: ${k}, value: ${v}")
    })
    final var policyNumber = enrollmentData.Details.get("policyNumber")
    final var email = enrollmentData.Details.get("emailAddress")
    var sDob = enrollmentData.Details.get("dob")
    sDob = sDob.length >= 10 ? sDob.substring(0, 10) : null
    var dob : Date
    try { dob = _dateFormatter.parse(sDob)  } catch(e:Exception) {}
    if (!policyNumber.HasContent || !email.HasContent || dob == null ) {
      throw new Exception("No account number provided")
    }
    _logger.debug("Request to enroll policy number " + policyNumber + " at an account level")

    final var period = EnrolmentQueries.getLatestPolicy(policyNumber);

    if (period == null){
      _logger.debug("Requested policy number does not exist, denying enrollment")
      return null
    }

    var account = period.Policy.Account
    var contact = account.AccountHolder.AccountContact.Contact
    return contact typeis Person && contact.DateOfBirth.trimToMidnight() == dob && contact.EmailAddress1 == email ?
        account.AccountNumber : null
  }
}
