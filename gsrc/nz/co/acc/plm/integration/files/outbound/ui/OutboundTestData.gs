package nz.co.acc.plm.integration.files.outbound.ui

uses gw.api.util.CurrencyUtil
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.outbound.ui.BaseOutboundTestData
uses nz.co.acc.plm.integration.files.outbound.FileTransformerFactory

uses gw.surepath.suite.integration.logging.StructuredLogger

uses java.math.BigDecimal
uses java.math.RoundingMode

/**
 * Created by nickmei on 21/04/2017.
 * Update by stefano.cortese on 10/05/2017 (for CPX letters)
 */
class OutboundTestData extends BaseOutboundTestData {

  construct() {
    _outboundBatchType = BatchProcessType.TC_OUTBOUNDMAILHOUSELETTERSFILE_ACC
  }


  /**
   * Get automatic generated test data
   *
   * @param num
   * @return
   */
  @Override
  function createOutboundRecord(num: int): OutBoundRecord_ACC {
    var testData: String
    var outBoundRecord = new OutBoundRecord_ACC()
    var recordTypes = FileTransformerFactory.getFileTransformer(this._outboundBatchType).OutboundRecordTypeList
    var type = recordTypes.get(0)
    outBoundRecord.Type = type
    outBoundRecord.Status = OutBoundRecordStatus_ACC.TC_NEW
    outBoundRecord.OriginEntityID = 1000000
    outBoundRecord.AccountNumber = "C000456351"
    switch (type) {
      case OutBoundRecordType_ACC.TC_CPX_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_RENEWAL:
        var amount_amt = num + 0.25
        testData = "<CpxOfferLetterData xmlns=\"http://guidewire.com/pc/gx/nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel\">" +
            "<AccountFullName>Dr Mark Red</AccountFullName>" +
            "<AccountStatus>Active</AccountStatus>" +
            "<Attn>@@noContent@@</Attn>" +
            "<AddressLine1>123 Victoria Square</AddressLine1>" +
            "<AddressLine2>Central District</AddressLine2>" +
            "<AddressLine3>@@noContent@@</AddressLine3>" +
            "<City>Auckland</City>" +
            "<PostCode>2001</PostCode>" +
            "<Country>New Zealand</Country>" +
            "<PrimaryEmail>redmark@randomemail.com</PrimaryEmail>" +
            "<Mobile>01-234-5678</Mobile>" +
            "<AccAccountNumber>S1234567</AccAccountNumber>" +
            "<ProductName>Individual</ProductName>" +
            "<PolicyLine>CoverPlus Extra</PolicyLine>" +
            "<CUDescription>Grape growing</CUDescription>" +
            "<CUCode>1140</CUCode>" +
            "<AgreedLevelOfCover>" + amount_amt + "</AgreedLevelOfCover>" +
            "<PolicyStartDate>2017-04-20T00:01:00+12:00</PolicyStartDate>" +
            "<PolicyEndDate>2018-04-01T00:01:00+13:00</PolicyEndDate>" +
            "<CoverTypeStandard>true</CoverTypeStandard>" +
            "</CpxOfferLetterData>"

        outBoundRecord.Data = testData
        outBoundRecord.OriginEntityName = "entity.PolicyPeriod"
        outBoundRecord.Amount = new MonetaryAmount(new BigDecimal(amount_amt).setScale(2, RoundingMode.HALF_UP), CurrencyUtil.getDefaultCurrency())
        break
      case OutBoundRecordType_ACC.TC_CPX_CANCEL:
        testData = "<CpxOfferLetterData xmlns=\"http://guidewire.com/pc/gx/nz.co.acc.plm.integration.files.outbound.letter.model.cpxofferletterdatamodel\">" +
            "<AccountFullName>Dr Mark Red</AccountFullName>" +
            "<AccountStatus>Active</AccountStatus>" +
            "<Attn>@@noContent@@</Attn>" +
            "<AddressLine1>123 Victoria Square</AddressLine1>" +
            "<AddressLine2>Central District</AddressLine2>" +
            "<AddressLine3>@@noContent@@</AddressLine3>" +
            "<City>Auckland</City>" +
            "<PostCode>2001</PostCode>" +
            "<Country>New Zealand</Country>" +
            "<PrimaryEmail>redmark@randomemail.com</PrimaryEmail>" +
            "<Mobile>01-234-5678</Mobile>" +
            "<AccAccountNumber>S1234567</AccAccountNumber>" +
            "<ProductName>Individual</ProductName>" +
            "<PolicyLine>CoverPlus Extra</PolicyLine>" +
            "</CpxOfferLetterData>"
        outBoundRecord.Data = testData
        outBoundRecord.OriginEntityName = "entity.PolicyPeriod"
        break
      default:
        var logLine =  this + " " + "getRecordData" + " " + "File Type not Found"
        StructuredLogger.INTEGRATION.error_ACC(logLine)
        throw new DisplayableException(logLine)

    }
    return outBoundRecord
  }


}