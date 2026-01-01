package nz.co.acc.integration.securemessage

uses gw.api.database.Query
uses gw.api.json.JsonObject

class SecureMessageUtil {

  static function convertToDisplayFormattedPayload(payload : String, template : SecureMessageTemplate_ACC) : String {
    switch (template) {
      case SecureMessageTemplate_ACC.TC_GWREPLYTOBCSS:
        return payload
      case SecureMessageTemplate_ACC.TC_BCSSREPLYTOGW:
        return formatReplyFromBCSS(payload)
      case SecureMessageTemplate_ACC.TC_CEASESHAREHOLDERPOLICY:
        return formatCeaseShareholderPolicy(payload)
      case SecureMessageTemplate_ACC.TC_BACKDATECUOREMPLOYMENTSTATUS:
        return formatBackdateCUES(payload)
      default:
        return payload
    }
  }

  static function formatCeaseShareholderPolicy(payload : String) : String {
    var json = JsonObject.parse(payload)
    var ceasedDate = json.getString("ceasedDate")
    var otherInformation = json.getString("otherInformation")
    var shareholderJsonArray = json.getObjectArray("shareholderDetails")

    var sb = new StringBuilder(1024)
    sb.append("Ceased date: ").append(ceasedDate).append("\n")
    sb.append("Shareholders:\n")

    for (shareholderJson in shareholderJsonArray) {
      sb.append("- Name: ").append(shareholderJson.getString("shareholderName")).append(", ")
      sb.append("ACC/IR number: ").append(shareholderJson.getString("accOrIrNumber")).append(", ")
      sb.append("Earnings: $").append(shareholderJson.getNumber("earnings")).append("\n")
    }
    if (otherInformation != null) {
      sb.append("Other information: ").append(otherInformation)
    }
    return sb.toString()
  }

  static function formatBackdateCUES(payload : String) : String {
    var json = JsonObject.parse(payload)
    var cuChange = json.getObject("cuChange")
    var esChange = json.getObject("esChange")
    var otherInformation = json.getString("otherInformation")

    var sb = new StringBuilder(1024)

    if (cuChange != null) {
      var cu = cuChange.getObject("cu")
      sb.append("CU Change Details:\n")
      sb.append("- CU code: ").append(cu.getString("cuCode")).append("\n")
      if (cu.containsKey("cuDescription")) {
        sb.append("- CU description: ").append(cu.getString("cuDescription")).append("\n")
      }
      sb.append("- BIC code: ").append(cu.getString("bicCode")).append("\n")
      if (cu.containsKey("bicDescription")) {
        sb.append("- BIC description: ").append(cu.getString("bicDescription")).append("\n")
      }
      sb.append("- CU change date: ").append(cuChange.getString("cuChangeDate")).append("\n")
      sb.append("- Activity description: ").append(cuChange.getString("activityDescription")).append("\n").append("\n")
    }
    if (esChange != null) {
      sb.append("Employment Status Details:\n")
      sb.append("- Status change date: ").append(esChange.getString("statusChangeDate")).append("\n")
      sb.append("- Employment type: ").append(esChange.getString("employmentType")).append("\n").append("\n")
    }
    if (otherInformation != null) {
      sb.append("Other information: ").append(otherInformation)
    }
    return sb.toString()
  }

  static function formatReplyFromBCSS(payload : String) : String {
    var json = JsonObject.parse(payload)
    var message = json.getString("message")
    return message
  }

  static function threadFormattedForNotes(latestMsg : SecureMessage_ACC) : String {
    var maxLength = ScriptParameters.SecureMessagingMaxNoteSize_ACC
    if (maxLength == 0) {
      return ""
    }

    var msgListDescending = {latestMsg}
    var threadMsgs = latestMsg.SecureMessageThread_ACC.messagesOrderedDescending().toList()
    if (threadMsgs.HasElements) {
      msgListDescending.addAll(threadMsgs)
    }
    var sb = new StringBuilder()

    for (msg in msgListDescending index i) {
      var msgString = msg.NoteDisplayFormat
      if (i == 0 and msgString.length() > maxLength) {
        sb.append(msgString.truncate(maxLength))
      } else if ((sb.length() + msgString.length()) <= maxLength) {
        sb.append(msgString)
      } else {
        break
      }
      if (sb.length() < maxLength) {
        sb.append("\n")
      }
    }
    return sb.toString().trim()
  }

  static function findUserByCredential(userName : String) : User {
    var user = Query.make(User)
        .join(User#Credential)
        .compare(Credential#UserName, Equals, userName)
        .select()
        .AtMostOneRow
    if (user == null) {
      throw new RuntimeException("User not found: ${userName}")
    }
    return user
  }

  static function isSystemOrIntegrationUser(user : User) : boolean {
    if (user.SystemUser) {
      return true
    } else {
      var username = user.Credential.UserName
      return username == "sys" or username == "su" or username.startsWithIgnoreCase("acc")
    }
  }

}