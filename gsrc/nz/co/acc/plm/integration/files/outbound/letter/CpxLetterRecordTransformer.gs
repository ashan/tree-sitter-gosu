package nz.co.acc.plm.integration.files.outbound.letter

uses gw.xml.XmlParseOptions
uses nz.co.acc.common.integration.files.outbound.RecordTransformer
uses nz.co.acc.common.integration.files.outbound.letter.MailhouseLineBuilder
uses nz.co.acc.plm.integration.files.outbound.OutboundConstants
uses nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel.CpxOfferLetterData

uses java.nio.charset.StandardCharsets

/**
 * Implementation of the base record transformer for the Mailhouse CPX letters outbound records.
 * This is a base record transformer for all the CPX letters, unless extended for specific letter cases.
 */
class CpxLetterRecordTransformer implements RecordTransformer {

  override function transformXMLToFileFormat(
      xmlStr : String, accountNumber : String, addressType : AddressPolicyType_ACC) : String {
    var utf8XmlStr = xmlStr.getBytes(StandardCharsets.UTF_8)
    var data = nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel.CpxOfferLetterData.parse(utf8XmlStr)
    var letterLine = buildCustomerLine(data) + OutboundConstants.Newline + buildPolicyLine(data)
    return letterLine
  }

  /**
   * Builder of a customer line on a CPX letter record
   *
   * @param data
   * @return
   */
  protected function buildCustomerLine(data : CpxOfferLetterData) : MailhouseLineBuilder {
    return new MailhouseLineBuilder()
        .append("C")
        .append(OutboundConstants.LetterId)
        .append(data.AccountFullName)
        .append(data.AccountStatus)
        .append(data.Attn)
        .append(data.AddressLine1)
        .append(data.AddressLine2)
        .append(data.AddressLine3)
        .append(data.City)
        .append(data.PostCode)
        .append(data.Country)
        .appendShortDateFormat(data.AddressValidUntil)
        .append(data.PrimaryEmail)
        .append(data.Mobile)
        .append(data.AccAccountNumber)
        .append(data.ProductName)
        .append(data.PolicyLine)
        .append(OutboundConstants.LetterDate)
        .append(data.CorrespondencePreference_ACC)
        .append(data.NZBN)
  }

  /**
   * Builder of a policy line on a CPX letter record
   *
   * @param data
   * @return
   */
  protected function buildPolicyLine(data : CpxOfferLetterData) : MailhouseLineBuilder {
    final var _standardCoverCode = "STD"
    final var _llwcCoverCode = "LLWC"
    final var coverType = data.CoverTypeStandard ? _standardCoverCode : _llwcCoverCode

    return new MailhouseLineBuilder()
        .append("P")
        .append(data.CUDescription)
        .append(data.CUCode)
        .append(data.AgreedLevelOfCover)
        .appendShortDateFormat(data.PolicyStartDate)
        .appendShortDateFormat(data.PolicyEndDate)
        .append(coverType)
        .append(data.GrossLevy)
  }

}