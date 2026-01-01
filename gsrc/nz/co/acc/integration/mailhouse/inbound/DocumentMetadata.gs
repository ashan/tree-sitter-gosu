package nz.co.acc.integration.mailhouse.inbound

uses java.time.LocalDate

class DocumentMetadata {
  var fileName : String as FileName
  var reference : String as Reference
  var documentDate : LocalDate as DocumentDate
  var accAccountID : String as ACCAccountID
  var accPolicyID : String as ACCPolicyID

  construct(line : String) {
    var cols = line.split("~")
    if (cols.length != 5) {
      throw new MailhouseFileLoadException("Line is not delimited with 5 columns: '${line}'")
    }
    fileName = cols[0]
    reference = cols[1]
    var docDate = cols[2]
    accAccountID = cols[3]
    accPolicyID = cols[4]

    try {
      documentDate = LocalDate.parse(docDate)
    } catch (e : Throwable) {
      throw new MailhouseFileLoadException("Failed to parse date '${docDate}'")
    }

    if (reference.equalsIgnoreCase("NULL")) {
      reference = null
    }

    if (accPolicyID.equalsIgnoreCase("NULL")) {
      accPolicyID = null
    }

  }

  override function toString(): String {
    return "DocumentMetadata(${fileName},${documentDate},${reference},${accAccountID},${accPolicyID})"
  }

}