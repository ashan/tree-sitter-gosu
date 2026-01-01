package nz.co.acc.plm.integration.files.outbound.ui

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths
uses gw.api.util.ConfigAccess
uses gw.api.util.DisplayableException
uses gw.pl.persistence.core.Key
uses nz.co.acc.common.integration.dms.SharepointAPI
uses nz.co.acc.common.integration.files.outbound.ui.BaseMailhouseControlFile2Generator

uses gw.surepath.suite.integration.logging.StructuredLogger

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
 * Simulate behaviour of Mailhouse returned PDF's and Control File and Bulk Load Facility.
 * Generate the Control File 2 which could be used for Inbound framework.
 * <p>
 * File pattern:
 * ACC_LevyInvoice_DM_20140923_063553.txt
 * Document pattern:
 * ACC_<ACC_ID>_LevyInvoice_DM_20140923_IPS13681537.pdf~IPS13681537~2014-09-23~<ACC_ID>~<SP_GUID>
 * Created by Nick on 30/03/2017.
 */
class MailhouseControlFile2Generator extends BaseMailhouseControlFile2Generator{

  function generateControlFile2(batchType: BatchProcessType) {
    var funcName = "generateControlFile2"
    logInfo("Starting...", funcName)

    var latestHeader = findLastestBatch(batchType)
    if (latestHeader == null) {
      throw new DisplayableException("No previous successful batch process of ${batchType.getCode()} : ${batchType.getDescription()}")
    }
    logInfo("Latest Batch found, header=${latestHeader.ID}, type=${latestHeader.BatchType.toString()}", funcName)
    switch (batchType) {
      case BatchProcessType.TC_OUTBOUNDMAILHOUSELETTERSFILE_ACC:
        fileType = "Letter"
        letterType = "PC"
        source = "WM"
        break
      default:
        throw new RuntimeException("Unsupported batch: ${batchType.getCode()}, ${batchType.getDescription()}")
    }

    batchDate = latestHeader.getCompletedTime()
    var results = getProcessedRecords(latestHeader)
    logInfo("Making File...", funcName)
    makeControlFile(latestHeader, results)
    logInfo("Finished!", funcName)
  }

  function getIdentifier(outboundRecord: OutBoundRecord_ACC): String {
    var identifier: String
    switch (outboundRecord.Type) {
      case OutBoundRecordType_ACC.TC_CPX_CANCEL:
      case OutBoundRecordType_ACC.TC_CPX_LAPSED_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_OFFER:
      case OutBoundRecordType_ACC.TC_CPX_RENEWAL:
      case OutBoundRecordType_ACC.TC_CPX_VARIATION:
        identifier = outboundRecord.ID.toString()
        return identifier
      default:
        throw new DisplayableException("Outbound Record type unknown, ${outboundRecord.Type.getCode()}")
    }
  }
}