package nz.co.acc.common.integration.files.outbound.ui

uses gw.api.util.CurrencyUtil
uses gw.api.web.WebFile
uses gw.pl.currency.MonetaryAmount
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.files.outbound.BaseOutboundFileBatchProcess
uses nz.co.acc.plm.integration.files.outbound.ui.MailhouseControlFile2Generator
uses org.apache.commons.io.IOUtils

uses java.math.BigDecimal

/**
 * Created by zhangji on 12/12/2016.
 */
abstract class BaseOutboundTestData {
  private static var _log = StructuredLogger.CONFIG.withClass(BaseOutboundTestData)
  private var _file: WebFile as File
  private var _importFileType = "application/vnd.ms-excel"

  private var _charSet = "UTF-8";
  private var _outboundRecordDataList: ArrayList<OutBoundRecord_ACC>
  private var _automaticFlag: boolean as AutomaticFlag  protected var _outboundBatchType: BatchProcessType as OutboundBatchType

  construct() {
    _automaticFlag = false
    _file = null
  }

  property get File(): WebFile {
    return _file
  }

  property set File(file: WebFile) {
    this._file = file
    _outboundRecordDataList = new ArrayList<OutBoundRecord_ACC>()
    if (_automaticFlag == false) {
      if (file != null && file.getMIMEType().equals(_importFileType)) {
        _log.info("Import: " + file.getName() + " came in with MIME type " + file.getMIMEType())
        var inputStream = this._file.getInputStream()
        try {
          var lines = IOUtils.readLines(inputStream, _charSet)
          var map = new HashMap<String, OutBoundRecord_ACC>()
          for (aLine in lines) {
            var elements = aLine.split(",")
            var outBoundRecord = new OutBoundRecord_ACC()
            outBoundRecord.Type = OutBoundRecordType_ACC.getTypeKey(elements[0])
            outBoundRecord.Status = OutBoundRecordStatus_ACC.TC_NEW
            outBoundRecord.OriginEntityID = Long.valueOf(elements[1])
            outBoundRecord.OriginEntityName = elements[2]
            outBoundRecord.AccountNumber = elements[3]
            if (elements[4].HasContent) {
              outBoundRecord.Amount = new MonetaryAmount(new BigDecimal(elements[4]), CurrencyUtil.getDefaultCurrency())
            }
            outBoundRecord.Data = elements[5]
            _outboundRecordDataList.add(outBoundRecord)
            //for invoice test data file
            if (elements.length == 7 && elements[6].HasContent) {
              outBoundRecord.DataOutput = elements[6]
              outBoundRecord.Status = OutBoundRecordStatus_ACC.TC_CONVERTED
            }
            _log.debug(outBoundRecord.Data)
          }
          if (map.size() > 0) {
            var records = map.values()
            for (record in records) {
              _outboundRecordDataList.add(record)
              _log.debug(record.Data)
            }
          }
        } catch (var9: Exception) {
          _log.error_ACC( "File can't be parsed", var9)
        } finally {
          IOUtils.closeQuietly(inputStream)
        }
      }
    }
  }

  /**
   * Button starts the generating the control file for latest batch type.
   */
  public function generateControlFile() {
    var mailhouse = new MailhouseControlFile2Generator()
    mailhouse.generateControlFile2(_outboundBatchType)
  }

  public function loadData() {
    var startTime = Calendar.getInstance().getTimeInMillis()
    _log.info("Data loading started at " + startTime)
    try {
      if (_automaticFlag) {
        for (i in 1..20) {
          gw.transaction.Transaction.runWithNewBundle(\newBundle -> {
            for (num in 1..10000) {
              var outBoundRecord = createOutboundRecord(num)
              outBoundRecord = newBundle.add(outBoundRecord)
            }
          })
        }
      } else {
        gw.transaction.Transaction.runWithNewBundle(\newBundle -> {
          for (var anOutboundRecord in _outboundRecordDataList) {
            anOutboundRecord = newBundle.add(anOutboundRecord)
          }
        })
      }
    } catch (ex: Exception) {
      _log.error_ACC( "Server can't load data", ex)
    }

    var recordFinished = Calendar.getInstance().getTimeInMillis()
    _log.info("Records creation completed at " + recordFinished)
    _log.info("Records creation used " + (recordFinished - startTime) + " millisecond")

    if (!_automaticFlag) {
      var job = new BaseOutboundFileBatchProcess(_outboundBatchType)
      job.doWork()

      var batchFinished = Calendar.getInstance().getTimeInMillis()
      _log.info("batch finished at " + batchFinished)
      _log.info("batch used " + (batchFinished - recordFinished) + " millisecond")
    }
  }

  /**
   * Get automatic generated test data
   *
   * @param num
   * @return
   */
  abstract function createOutboundRecord(num: int): OutBoundRecord_ACC

}