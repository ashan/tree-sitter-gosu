package nz.co.acc.common.integration.files.outbound

uses gw.util.GosuStringUtil
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty

/**
 * Created by Nick on 5/12/2016.
 */
abstract class BaseOutboundFileTransformer {

  private var _fileName: String as fileName
  private var _hasControlFile: boolean as HasControlFile
  private var _outboundRecordTypeList: ArrayList<OutBoundRecordType_ACC>as OutboundRecordTypeList /*This list tells what record types this File Transfer should process */
  private var _delimiter: String as Delimiter
  private var _buildTypeLine: boolean as BuildRecordTypeHeaderLine
  private var _buildTypeFooterLine: boolean as BuildRecordTypeFooterLine
  private var _buildTrailerWithAccountStats: boolean as BuildTrailerWithAccountStats
  private var _lineSeq: int as LineSeq
  private var _hasRecordAmount: boolean as HasRecordAmount
  private var _processFolder: String as FOLDER_OUTGOING_PROCESSING_DEFAULT
  private var _doneFolder: String as FOLDER_OUTGOING_DONE_DEFAULT
  private var _errorFolder: String as FOLDER_OUTGOING_ERROR_DEFAULT
  private var _controlFileSuffix: String as ControlFileSuffix

  construct() {
    _outboundRecordTypeList = new ArrayList<OutBoundRecordType_ACC>()
    _delimiter = ","
    _controlFileSuffix = ".cntl"
    _lineSeq = 0
    _buildTypeLine = false
    _buildTypeFooterLine = false
    _hasRecordAmount = true
    _hasControlFile = false
    _processFolder = ConfigurationProperty.OUTBOUND_PROCESS_FOLDER.PropertyValue
    _errorFolder = ConfigurationProperty.OUTBOUND_ERROR_FOLDER.PropertyValue
  }

  /**
   * This method is used to generate output file name
   * This method should be implemented by all File transfer classes
   *
   * @return
   */
  abstract function generateOutputFilename(): String

  /**
   * This method is to return a string which will be written as the header line in the file output.
   * The default assumption, here null, means no header line, required.
   *
   * @return
   */
  function buildHeaderLineForFile(): String {
    return null
  }

  /**
   * The return value will be written as a line item in the file output.
   * placeholder values and sequence numbers will be replaced by real data here.
   *
   * @param customerFormattedData
   * @return
   */
  function buildItemLineForFile(customerFormattedData: String, letterID: Long): String {
    return customerFormattedData
  }

  /**
   * This method is to return a string which will be written as the type header line in the file output.
   * The default assumption, here null, means no header line, required.
   *
   * @return
   */
  function buildTypeHeaderLine(type: OutBoundRecordType_ACC): String {
    return null
  }

  /**
   * This method is to return a string which will be written as the type foter line in the file output.
   * The default assumption, here null, means no header line, required.
   *
   * @return
   */
  function buildTypeFooterLine(type: OutBoundRecordType_ACC, count: int): String {
    return null
  }

  /**
   * The return value will be written as the trailer line in the file output.
   * The default assumption, here null, means no trailer line, required.
   *
   * @return
   */
  function buildTrailerLineForFile(statistics: FileStatistics): String {
    return null
  }


  /**
   * This method is for any batch to provide their own behaviour after the batch has completed.
   *
   * @return
   */
  function postBatchFile(outboundHeader: OutBoundHeader_ACC) {
    // Implementation specific, the default behaviour is nothing.
  }

  /**
   * This is a helper method used to format a string, with proper handling of nulls and ensuring the max length of the string is maintained.
   *
   * @param field
   * @param fieldLength
   * @param pad
   * @param padChar
   * @return
   */
  protected function format(field: String, fieldLength: int, pad: PAD, padChar: String): String {

    var resultField: String
    switch (pad) {
      case LEFT_PAD:
        resultField = GosuStringUtil.leftPad(GosuStringUtil.trimToEmpty(field), fieldLength, padChar)
        break;
      case RIGHT_PAD:
        resultField = GosuStringUtil.rightPad(GosuStringUtil.trimToEmpty(field), fieldLength, padChar)
        break;
      default:
        resultField = GosuStringUtil.trimToEmpty(field)
    }
    if (resultField.length() > fieldLength) {
      resultField = resultField.substring(0, fieldLength);
    }
    return resultField
  }

  protected enum PAD {
    LEFT_PAD, RIGHT_PAD
  }

}
