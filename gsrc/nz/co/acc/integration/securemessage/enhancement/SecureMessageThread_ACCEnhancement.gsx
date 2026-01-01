package nz.co.acc.integration.securemessage.enhancement

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

enhancement SecureMessageThread_ACCEnhancement : SecureMessageThread_ACC {

  function findLatestReply() : SecureMessage_ACC {
    return Query.make(SecureMessage_ACC)
        .compare(SecureMessage_ACC#SecureMessageThread_ACC, Relop.Equals, this)
        .compare(SecureMessage_ACC#Source, Relop.Equals, SecureMessageSource_ACC.TC_BCSS)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(SecureMessage_ACC#MessageTime)))
        .first()
  }

  /**
   * Creates a reply to the latest received message for this thread.
   * <p>
   * MessageTime field is set by PreUpdate on bundle commit.
   *
   * @return
   */
  function createNewMessage() : SecureMessage_ACC {
    var latestReply = findLatestReply()
    var message = new SecureMessage_ACC()
    message.SecureMessageThread_ACC = this
    message.Account = this.Account
    message.MessageID = UUID.randomUUID().toString()
    message.ReplyToMessageID = latestReply.MessageID
    message.Source = SecureMessageSource_ACC.TC_GUIDEWIRE
    message.Template = SecureMessageTemplate_ACC.TC_GWREPLYTOBCSS
    message.SenderName = User.util.CurrentUser.Contact.DisplayName
    return message
  }

  /**
   * Order by GW CreateTime as messages from external systems may be delayed
   *
   * @return
   */
  function messagesOrderedDescending() : SecureMessage_ACC[] {
    return Query.make(SecureMessage_ACC)
        .compare(SecureMessage_ACC#SecureMessageThread_ACC, Relop.Equals, this)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(SecureMessage_ACC#CreateTime)))
        .toTypedArray()
  }

}
