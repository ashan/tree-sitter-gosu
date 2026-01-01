package nz.co.acc.integration.securemessage

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.json.JsonObject
uses gw.api.webservice.exception.BadIdentifierException
uses gw.api.webservice.exception.FieldFormatException
uses gw.api.webservice.exception.ServerStateException
uses gw.pl.persistence.core.Bundle
uses gw.surepath.suite.integration.logging.StructuredLogger_ACC
uses gw.util.GosuStringUtil
uses nz.co.acc.activity.ActivityCodes
uses nz.co.acc.lob.common.DateUtil_ACC
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.util.AssignableQueueUtils

class SecureMessageAPIHandler {
  final var log = StructuredLogger_ACC.INTEGRATION.withClass(this)

  function createMessage(body : JsonObject) : JsonObject {
    if (not ConfigurationProperty.SECUREMESSAGING_SERVICE_ENABLED.PropertyValue.toBoolean()) {
      throw new ServerStateException("Secure Messaging is disabled")
    }

    var messageId = body.getString("messageId")
    var messageTimestamp = body.getString("createdDate")
    var sourceTypecode = body.getString("source")
    var optionalReplyMessageID = (body.getObject("replyTo")?.getString("replyMessageId") ?: "").toOptional()
    var messageDetailsJson = body.getObject("messageDetails")
    var templateName = messageDetailsJson.getString("template")

    var bcssMessage = messageDetailsJson.getObject("data")
    var accID = bcssMessage.getString("accNumber")
    var senderName = bcssMessage.getString("senderName")

    var account = Account.finder.findAccountByACCID(accID)
    if (account == null) {
      throw new BadIdentifierException("Account not found with ACCID '${accID}'")
    }

    var messageTime : Date
    try {
      messageTime = DateUtil_ACC.fromISOString(messageTimestamp)
    } catch (e : Exception) {
      throw new FieldFormatException("messageTime field could not be parsed as ISO timestamp: " + e.Message)
    }

    var source = SecureMessageSource_ACC.getTypeKey(sourceTypecode)
    if (source == null) {
      throw new FieldFormatException("source field references unknown source '${sourceTypecode}'")
    }

    var template = SecureMessageTemplate_ACC.fromIntegrationTemplateName(templateName)

    gw.transaction.Transaction.runWithNewBundle(\bundle -> {
      processNewMessage(bundle, account, senderName, messageId, messageTime, optionalReplyMessageID, source, template, bcssMessage)
    }, "su")

    return {}
  }

  private function processNewMessage(
      bundle : Bundle,
      account : Account,
      senderName : String,
      messageId : String,
      messageTime : Date,
      replyToMessageId : Optional<String>,
      source : SecureMessageSource_ACC,
      template : SecureMessageTemplate_ACC,
      bcssMessage : JsonObject) {

    var threadID = bcssMessage.getString("threadId")
    if (threadID == null and not replyToMessageId.Present) {
      throw new RuntimeException("Error in ${messageId} on account ${account.ACCID_ACC}: Message has no threadId or replyToId ")
    }
    var subject = bcssMessage.getString("subject")
    if (subject == null) {
      throw new RuntimeException("Missing subject for message ${messageId} on account ${account.ACCID_ACC}")
    }

    if (template != SecureMessageTemplate_ACC.TC_BCSSREPLYTOGW and threadExists(threadID)) {
      throw new RuntimeException("Thread already exists with threadID ${threadID}")
    }

    var thread = findOrCreateThread(bundle, account, threadID, replyToMessageId, subject)
    updateThread(thread, messageTime, replyToMessageId.Present)

    var secureMessage = createSecureMessage(
        bundle, account,senderName, messageId, messageTime, thread, replyToMessageId, source, template, bcssMessage)

    createActivityIfNoneOpen(bundle, secureMessage)
  }

  private function findOrCreateThread(
      bundle : Bundle,
      account : Account,
      threadID : String,
      replyToMessageId : Optional<String>,
      subject : String) : SecureMessageThread_ACC {

    var thread : SecureMessageThread_ACC

    if (threadID == null) {
      var replyMessage = findMessage(account, replyToMessageId.get())
      thread = replyMessage.SecureMessageThread_ACC
    } else {
      thread = Query.make(SecureMessageThread_ACC)
          .compare(SecureMessageThread_ACC#ThreadID, Relop.Equals, threadID)
          .compare(SecureMessageThread_ACC#Account, Relop.Equals, account)
          .select()
          .FirstResult
    }

    if (thread == null) {
      thread = new SecureMessageThread_ACC(bundle)
      thread.Account = account
      thread.ThreadID = threadID
      thread.Subject = subject
    }

    return bundle.add(thread)
  }

  private function threadExists(threadID : String) : boolean {
    if (GosuStringUtil.isBlank(threadID)) {
      return false
    } else {
      return Query.make(SecureMessageThread_ACC)
          .compare(SecureMessageThread_ACC#ThreadID, Relop.Equals, threadID)
          .select()
          .HasElements
    }
  }

  private function findMessage(account : Account, messageID : String) : SecureMessage_ACC {
    var message = Query.make(SecureMessage_ACC)
        .compare(SecureMessage_ACC#Account, Relop.Equals, account)
        .compare(SecureMessage_ACC#MessageID, Relop.Equals, messageID)
        .select()
        .FirstResult
    if (message == null) {
      throw new BadIdentifierException("Message not found with MessageID '${messageID}'")
    } else {
      return message
    }
  }

  private function updateThread(thread : SecureMessageThread_ACC, messageTime: Date, isReply : boolean) {
    if (isReply) {
      thread.LastMessageTime = messageTime
      thread.Status = SecureMessageThreadStatus_ACC.TC_CUSTOMERREPLIED
    } else {
      thread.FirstMessageTime = messageTime
      thread.LastMessageTime = messageTime
    }
  }

  private function createSecureMessage(
      bundle : Bundle,
      account : Account,
      senderName : String,
      messageID : String,
      messageTime : Date,
      thread : SecureMessageThread_ACC,
      replyToMessageID : Optional<String>,
      source : SecureMessageSource_ACC,
      template : SecureMessageTemplate_ACC,
      payload : JsonObject) : SecureMessage_ACC {
    log.info("Creating SecureMessage: Account=${account.ACCID_ACC}, MessageID=${messageID}, "
        + "MessageTime=${messageTime.toISOTimestamp()}, ThreadID=${thread.ThreadID}, ReplyToMessageID=${replyToMessageID}"
        + ", Template=${template}")
    var secureMessage = new SecureMessage_ACC(bundle)
    secureMessage.Account = account
    secureMessage.MessageID = messageID
    secureMessage.MessageTime = messageTime
    secureMessage.SecureMessageThread_ACC = thread
    secureMessage.SenderName = senderName
    secureMessage.ReplyToMessageID = replyToMessageID.orElse(null)
    secureMessage.Source = source
    secureMessage.Template = template
    secureMessage.Payload = payload.toPrettyJsonString()

    thread = bundle.add(thread)
    return secureMessage
  }

  private function createActivityIfNoneOpen(bundle : Bundle, msg : SecureMessage_ACC) {
    var activity = msg.SecureMessageThread_ACC.Activity
    if (activity.Status != ActivityStatus.TC_OPEN) {
      createActivity(bundle, msg)
    } else {
      log.info("SecureMessage ${msg.MessageID} has an open activity ID=${activity.ID}")
    }
  }

  private function createActivity(bundle : Bundle, secureMessage : SecureMessage_ACC) {
    log.info("Creating Activity for SecureMessage ${secureMessage.MessageID}")
    var thread = secureMessage.SecureMessageThread_ACC
    var pattern = ActivityPattern.finder.getActivityPatternByCode(ActivityCodes.MyACCForBusinessRequest)
    var queue = lookupActivityQueue(secureMessage)
    var subject = "BCSS Secure Message: " + thread.Subject
    var description = "Request from MyACC For Business customer:\n" + secureMessage.DisplayFormattedPayload
    var activity = pattern.createAccountActivity(
        bundle,
        pattern,
        secureMessage.Account,
        subject,
        description,
        null, null, null, null, null)
    activity.assignActivityToQueue(queue, queue.Group)
    activity.SecureMessageThread_ACC = thread
    thread.Activity = activity
  }

  private function lookupActivityQueue(secureMessage : SecureMessage_ACC) : AssignableQueue {
    switch (secureMessage.Template) {
      case SecureMessageTemplate_ACC.TC_BACKDATECUOREMPLOYMENTSTATUS:
        return AssignableQueueUtils.getLevyManagementQueue()
      case SecureMessageTemplate_ACC.TC_CEASESHAREHOLDERPOLICY:
        return AssignableQueueUtils.getPolicyAdministrationQueue()
      default:
        return AssignableQueueUtils.getPolicyAdministrationQueue()
    }
  }

}