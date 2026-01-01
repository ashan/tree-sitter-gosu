package nz.co.acc.common.integration.files.outbound.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.util.ConfigAccess
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.common.integration.dms.SharepointAPI

uses java.io.File
uses java.io.FileInputStream
uses java.io.IOException
uses java.io.InputStream
uses java.io.OutputStream
uses java.io.PrintWriter
uses java.nio.file.FileSystems
uses java.nio.file.Files
uses java.nio.file.StandardOpenOption
uses java.time.Instant
uses java.time.LocalDateTime
uses java.time.ZoneId
uses java.time.format.DateTimeFormatter

/**
 * Base class for simulating behaviour of Mailhouse returned PDF's and Control File and Bulk Load Facility.
 * Generate the Control File 2 which could be used for Inbound framework.
 * <p>
 * Output Control Filename pattern:
 * ACC_LevyInvoice_DM_20140923_063553.txt
 * Control File Document pattern:
 * ACC_<ACC_ID>_LevyInvoice_DM_20140923_IPS13681537.pdf~IPS13681537~2014-09-23~<ACC_ID>~<SP_GUID>
 * <p>
 * Created by Nick on 30/03/2017.
 */
abstract class BaseMailhouseControlFile2Generator {
  final static var FOLDER_MAILHOUSE: String = "/tmp/pc/mailhouse-generated"

  public var fileType: String = null
  public var letterType: String = null
  public var source: String = null
  public var batchDate: Date = null

  private static var _log = StructuredLogger.INTEGRATION.withClass(BaseMailhouseControlFile2Generator)

  @Override
  abstract function generateControlFile2(batchType: BatchProcessType);

  function findLastestBatch(batchType: BatchProcessType): OutBoundHeader_ACC {
    var queryHeaderObj = Query.make(entity.OutBoundHeader_ACC)
    queryHeaderObj.compare(entity.OutBoundHeader_ACC#BatchType, Relop.Equals, batchType.getCode())
    queryHeaderObj.compare(entity.OutBoundHeader_ACC#Status, Relop.Equals, OutBoundHeaderStatus_ACC.TC_COMPLETED)
    var orderBy = QuerySelectColumns.path(Paths.make(entity.OutBoundHeader_ACC#CompletedTime))
    var resultHeaderObj = queryHeaderObj.withLogSQL(true).select().orderByDescending(orderBy)
    return resultHeaderObj.first()
  }

  function getProcessedRecords(outboundHeader: OutBoundHeader_ACC): IQueryBeanResult<OutBoundRecord_ACC> {
    var queryRecordsObj = Query.make(entity.OutBoundRecord_ACC)
    queryRecordsObj.compare(entity.OutBoundRecord_ACC#Header, Relop.Equals, outboundHeader)
    queryRecordsObj.compare(entity.OutBoundRecord_ACC#Status, Relop.Equals, OutBoundRecordStatus_ACC.TC_PROCESSED)
    var orderBy = QuerySelectColumns.path(Paths.make(entity.OutBoundRecord_ACC#CreateTime))
    var resultRecordsObj = queryRecordsObj.withLogSQL(true).select().orderBy(orderBy) as IQueryBeanResult<OutBoundRecord_ACC>
    return resultRecordsObj
  }

  function makeControlFile(outboundHeader: OutBoundHeader_ACC, results: IQueryBeanResult<OutBoundRecord_ACC>) {
    var funcName = "makeControlFile"
    var localDateTime = LocalDateTime.ofInstant(Instant.ofEpochMilli(batchDate.getTime()), ZoneId.systemDefault())
    var dateString = localDateTime.format(DateTimeFormatter.ofPattern("yyyyMMdd"))
    var timeString = localDateTime.format(DateTimeFormatter.ofPattern("HHmmss"))
    var controlFilename : String

    if(fileType.equals("LevyInvoice")) {
      controlFilename = "ACC-${fileType}-${source}-${dateString}-${timeString}.txt"
    }else{
      controlFilename = "ACC-${fileType}-${source}-${letterType}-${dateString}-${timeString}.txt"
    }
    var processingFilePath = FileSystems.getDefault().getPath(FOLDER_MAILHOUSE, {controlFilename})

    var fos: OutputStream
    var writer: PrintWriter

    try {
      fos = Files.newOutputStream(processingFilePath, {StandardOpenOption.CREATE})
      writer = new PrintWriter(fos)
      // Write the first line as "OutboundFile~<outbound filename>"
      writer.println("OutboundFile~${outboundHeader.FileName}");

      if (!results.isEmpty()) {
        // Generate only one sharepoint document to be used for the whole control file. It is too inefficient to add every document to sharepoint.
        var spGUID = "A212EB76-B91B-4A65-B8A1-EE3C5367DFFA" //Hard coded GUID of an existing document on SPO for efficiency

        results.each(\outboundRecord -> {
          var accID = outboundRecord.AccountNumber
          var identifier = getIdentifier(outboundRecord)
          var documentFilename : String
          if(fileType.equals("LevyInvoice")){
            documentFilename = "ACC-${accID}-${fileType}-${source}-${dateString}-${identifier}.pdf"
          }else{
            documentFilename = "ACC-${accID}-${letterType}-${outboundRecord.Type.Code}-${source}-${dateString}-${identifier}.pdf"
          }
          var dateFieldString = localDateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"))
          var messageForFile = "${documentFilename}~${identifier}~${dateFieldString}~${outboundRecord.AccountNumber}~${outboundRecord.PolicyNumber}~${spGUID}"
          writer.println(messageForFile);
        })
      }
    } catch (e: Exception) {
      logError("Failed to make Control File.", funcName, e)
      throw new DisplayableException("Failed to make Control File. ${e.Message}", e)
    } finally {
      if (writer != null) {
        try {
          writer.close()
        } catch (e: IOException) {
          logError("Unexpected IO error occured closing the outbound processing file ", funcName, e)
          throw new DisplayableException("Failed to close file handle.", e)
        }
      }
      if (fos != null) {
        try {
          fos.close()
        } catch (e: IOException) {
          logError("Unexpected IO error occured closing the outbound processing file ", funcName, e)
          throw new DisplayableException("Failed to close file handle.", e)
        }
      }
    }
  }

  @Override
  abstract function getIdentifier(outboundRecord: OutBoundRecord_ACC): String

  /**
   * Local helper method to log errors.
   *
   * @param errMsg
   * @param funcName
   * @param t
   */
  function logError(errMsg: String, funcName: String, e: Exception) {
   _log.error_ACC(errMsg, e)
  }

  /**
   * Local helper method to log info.
   *
   * @param msg
   * @param funcName
   * @param t
   */
  function logInfo(msg: String, funcName: String) {
    _log.info(msg)
  }
}
