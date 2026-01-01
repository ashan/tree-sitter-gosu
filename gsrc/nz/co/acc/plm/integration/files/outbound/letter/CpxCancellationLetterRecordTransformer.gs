package nz.co.acc.plm.integration.files.outbound.letter

uses nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel.CpxOfferLetterData

uses java.nio.charset.StandardCharsets

/**
 * Implementation of the record transformer for the outbound records of Mailhouse Cancellation CPX letters .
 */
class CpxCancellationLetterRecordTransformer extends CpxLetterRecordTransformer {

  override function transformXMLToFileFormat(xmlStr : String, accountNumber : String, addressType : AddressPolicyType_ACC) : String {
    var utf8XmlStr = xmlStr.getBytes(StandardCharsets.UTF_8)
    var data = nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel.CpxOfferLetterData.parse(utf8XmlStr) as CpxOfferLetterData
    // printing out only customer record in case of cancellation letter
    return super.buildCustomerLine(data)
        .append(data.MinimumCPXCover)
        .append(data.CancellationReason)
        .append(data.CancellationDate)
        .appendLongDateFormat(data.PolicyStartDate)
        .appendLongDateFormat(data.PolicyEndDate)
        .toString()
  }

}