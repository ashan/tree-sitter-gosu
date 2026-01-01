package nz.co.acc.plm.integration.files.outbound.letter

uses gw.api.system.database.SequenceUtil
uses nz.co.acc.common.integration.files.outbound.BaseOutboundFileTransformer
uses nz.co.acc.common.integration.files.outbound.FileStatistics
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.files.outbound.OutboundConstants
uses org.apache.commons.lang.time.DateUtils

uses java.text.SimpleDateFormat

/**
 * File transformer for the generation of the Mailhouse CPX letters outbound file.
 * It extends the base class BaseOutboundFileTransformer of the outbound framework.
 */
class CpxLetterFileTransformer extends BaseOutboundFileTransformer {
  private var fileNumber : long as FileNumber

  private var _fileHeader = "FH"
  private var _letterHeader = "LH"
  private var _letterFoot = "LF"
  private var _fileFoot = "FF"

  private var _fileNameDate = new SimpleDateFormat("yyMMdd").format(gw.api.util.DateUtil.currentDate()) //part of the output file name
  private var _letterDate = new SimpleDateFormat("dd MMMM yyyy").format(DateUtils.addDays(Date.Now, 1)) // current date plus 1 for letters are generated one day later than file generated

  construct() {
    OutboundRecordTypeList = {
        OutBoundRecordType_ACC.TC_CPX_OFFER,
        OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER,
        OutBoundRecordType_ACC.TC_CPX_RENEWAL,
        OutBoundRecordType_ACC.TC_CPX_CANCEL,
        OutBoundRecordType_ACC.TC_CPX_VARIATION}
    Delimiter = "|"
    HasControlFile = true
    BuildRecordTypeHeaderLine = true
    BuildRecordTypeFooterLine = true
    FOLDER_OUTGOING_DONE_DEFAULT = ConfigurationProperty.OUTBOUND_DONE_MAILHOUSE2_FOLDER.PropertyValue
  }

  override function generateOutputFilename() : String {
    fileNumber = SequenceUtil.next(10000, "Mailhouse_Letter_File")
    fileName = "PC${_fileNameDate}_${fileNumber}.psv"
    return fileName
  }

  override function buildHeaderLineForFile() : String {
    return "${_fileHeader}${Delimiter}${fileName}${Delimiter}${fileNumber}"
  }

  override function buildTypeHeaderLine(type : OutBoundRecordType_ACC) : String {
    return "${_letterHeader}|${type.Code}"
  }

  override function buildItemLineForFile(itemLine : String, letterID: Long) : String {
    itemLine = itemLine.replaceFirst(OutboundConstants.LetterDate, String.valueOf(_letterDate))
    itemLine = itemLine.replaceFirst(OutboundConstants.LetterId, String.valueOf(letterID))
    return itemLine
  }

  override function buildTypeFooterLine(type : OutBoundRecordType_ACC, count : int) : String {
    return "${_letterFoot}|${count}"
  }

  override function buildTrailerLineForFile(statistics : FileStatistics) : String {
    var numOfProcessed = statistics.NumOfRecordsProcessed
    var numOfUniqueRecords = statistics.NumOfUniqueAccounts
    return "${_fileFoot}|${numOfProcessed}|${numOfUniqueRecords}"
  }

}