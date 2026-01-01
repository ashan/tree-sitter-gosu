package nz.co.acc.integration.securemessage.enhancement

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.i18n.DateTimeFormat
uses nz.co.acc.integration.securemessage.SecureMessageUtil

enhancement SecureMessage_ACCEnhancement : SecureMessage_ACC {

  property get DisplayFormattedPayload() : String {
    return SecureMessageUtil.convertToDisplayFormattedPayload(this.Payload, this.Template)
  }

  property get ReplyMessage() : SecureMessage_ACC {
    if (this.ReplyToMessageID == null) {
      return null
    } else {
      return Query.make(SecureMessage_ACC)
          .compare(SecureMessage_ACC#SecureMessageThread_ACC, Relop.Equals, this.SecureMessageThread_ACC)
          .compare(SecureMessage_ACC#MessageID, Relop.Equals, this.ReplyToMessageID)
          .select()
          .single()
    }
  }

  property get NoteDisplayFormat() : String {
    var sb = new StringBuilder(1024)
    sb.append(this.MessageTime.formatDateTime(DateTimeFormat.MEDIUM, DateTimeFormat.MEDIUM)).append("\n")
    sb.append("Source: ").append(this.Source.DisplayName).append("\n")
    sb.append("Message: ").append(this.DisplayFormattedPayload).append("\n")
    return sb.toString()
  }

}
