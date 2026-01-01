package nz.co.acc.integration.junoinformationservice.payloadgenerator.account

uses nz.co.acc.integration.junoinformationservice.model.account.GSONAccountNote

/**
 * Payload generator for the Note entity.
 */
class AccountNoteGsonGenerator {

  function generate(entity: Note): GSONAccountNote {
    if (entity == null) {
      return null
    }

    var gsonDoc = new GSONAccountNote()

    gsonDoc.topic = entity.Topic?.Code
    gsonDoc.subTopic = entity.SubTopic_ACC?.Code
    gsonDoc.subject = entity.Subject.NotBlank ? entity.Subject : "Guidewire Notes"
    gsonDoc.securityType = entity.SecurityType?.Code
    gsonDoc.text = entity.Body
    gsonDoc.author = entity.CreateUser.Credential.UserName

    return gsonDoc
  }

}