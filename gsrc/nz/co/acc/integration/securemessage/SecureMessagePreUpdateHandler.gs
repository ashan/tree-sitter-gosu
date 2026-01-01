package nz.co.acc.integration.securemessage

class SecureMessagePreUpdateHandler {

  static function newMessage(secureMessage : SecureMessage_ACC) {
    if (secureMessage.New) {
      setMessageTimeAndThreadStatus(secureMessage)
      createNote(secureMessage)
    }
  }

  private static function setMessageTimeAndThreadStatus(secureMessage : SecureMessage_ACC) {
    if (secureMessage.Source == SecureMessageSource_ACC.TC_GUIDEWIRE and secureMessage.MessageTime == null) {
      secureMessage.MessageTime = Date.Now
      secureMessage.addEvent(SecureMessageEvents.SECURE_MESSAGE_ACC)

      var thread = secureMessage.SecureMessageThread_ACC
      thread.LastMessageTime = Date.Now
      thread.Status = SecureMessageThreadStatus_ACC.TC_STAFFREPLIED
    }
  }

  private static function createNote(secureMessage : SecureMessage_ACC) {
    var body = SecureMessageUtil.threadFormattedForNotes(secureMessage)
    if (body.Blank) {
      return
    }

    var author = User.util.CurrentUser

    if (SecureMessageUtil.isSystemOrIntegrationUser(author)) {
      // CRM will only accept notes from this specific service user or ACC staff
      author = SecureMessageUtil.findUserByCredential("svc_APIMINT.User")
    }

    var note = new Note(secureMessage.Bundle)
    note.Account = secureMessage.Account
    note.Topic = NoteTopicType.TC_POLICYQUERY_ACC
    note.SecurityType = NoteSecurityType.TC_INTERNALONLY
    note.Subject = secureMessage.SecureMessageThread_ACC.Subject
    note.Author = author
    note.Body = body
  }

}
