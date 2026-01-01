package nz.co.acc.web.messaging

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * Created by Mike Ourednik on 18/06/2019.
 */
class MessageFinderUIHelper {

  var _accountACCID : String as AccountACCID
  var _contactACCID : String as ContactACCID
  var _account : Account as readonly AccountResult
  var _contact : Contact as readonly ContactResult
  var _messageHistory : IQueryBeanResult<MessageHistory>as readonly MessageHistoryResult
  var _messages : IQueryBeanResult<Message>as readonly MessagesResult

  private var _destinationMap : Map<Integer, String> = gw.api.admin.MessagingUtil.getEventMessageDestinationMap()

  private function findAccount(accID : String) {
    if (accID == null) {
      _account = null
    } else if (accID != _account?.ACCID_ACC) {
      _account = Query.make(Account).compareIgnoreCase(Account#ACCID_ACC, Relop.Equals, accID).select().AtMostOneRow
    }
  }

  private function findContact(accID : String) {
    if (accID == null) {
      _contact = null
    } else if (accID != _contact?.ACCID_ACC) {
      _contact = Query.make(Contact).compareIgnoreCase(Contact#ACCID_ACC, Relop.Equals, accID).select().AtMostOneRow
    }
  }

  public function findMessagesForAccount() {
    findAccount(_accountACCID?.trim())

    if (_account != null) {
      _messages = Query.make(Message)
          .compare(Message#Account, Relop.Equals, _account)
          .select()
      _messageHistory = Query.make(MessageHistory)
          .compare(MessageHistory#Account, Relop.Equals, _account)
          .select()
    } else {
      _messages = null
      _messageHistory = null
    }
  }

  public function findMessagesForContact() {
    findContact(_contactACCID?.trim())

    if (_contact != null) {
      _messages = Query.make(Message)
          .compare(Message#Contact, Relop.Equals, _contact)
          .select()
      _messageHistory = Query.make(MessageHistory)
          .compare(MessageHistory#Contact, Relop.Equals, _contact)
          .select()
    } else {
      _messages = null
      _messageHistory = null
    }
  }

  public function messageHistoryStatusString(status : Integer) : String {
    if (status == 10) {
      return "Acked"
    } else if (status == 11) {
      return "Error cleared"
    } else if (status == 12) {
      return "Error retried"
    } else if (status == 13) {
      return "Skipped"
    } else {
      // this case never occurs
      return "Unknown status code: ${status}"
    }
  }

  public function messageStatusString(status : Integer) : String {
    if (status == 1) {
      return "Pending send"
    } else if (status == 2) {
      return "Pending ack"
    } else if (status == 3) {
      return "Error"
    } else if (status == 4) {
      return "Retryable Error"
    } else {
      // this case never occurs
      return "Unknown status code: ${status}"
    }
  }

  public function destinationString(destinationID : Integer) : String {
    return _destinationMap.get(destinationID)
  }
}