package nz.co.acc.integration.ir.workqueue

uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.pl.persistence.core.Bundle
uses gw.util.GosuStringUtil
uses nz.co.acc.integration.ir.record.AbstractIRRecord
uses nz.co.acc.integration.ir.record.CARA4Record
uses nz.co.acc.integration.ir.record.CARA5Record
uses nz.co.acc.integration.ir.record.CARA6Record
uses nz.co.acc.integration.ir.record.CREGRecord

/**
 * Database access object for IR record processing.
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
class IRInboundRecordProcessorDAO {

  /**
   * Retrieves all IR inbound records to be processed for a specified ACCID, correctly ordered in sequence received from IR
   *
   * @param accID
   * @return
   */
  function loadIRInboundRecords(accID : String) : List<IRInboundRecord_ACC> {
    return Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, accID)
        .compareNotIn(IRInboundRecord_ACC#Status, {
            IRInboundRecordStatus_ACC.TC_PROCESSED,
            IRInboundRecordStatus_ACC.TC_SKIPPEDBYUSER,
            IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM
        })
        .join(IRInboundRecord_ACC#IRInboundBatch_ACC)
        .compare(IRInboundBatch_ACC#Status, Relop.Equals, IRInboundBatchStatus_ACC.TC_LOADED)
        .select()
        .toList()
        .orderBy(\_record -> _record.CreateTime)
        .thenBy(\_record -> _record.RecordSequence)
  }

  public function loadIRInboundRecord(inboundRecordPublicID : String) : IRInboundRecord_ACC {
    return Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#PublicID, Relop.Equals, inboundRecordPublicID)
        .select().single()
  }

  public function setRecordStatusPayloadInvalid(inboundRecord : IRInboundRecord_ACC, error : String) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      inboundRecord = bundle.add(inboundRecord)
      inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_INVALIDPAYLOAD)
      inboundRecord.setRuntimeMessage(error?.truncate(1300))
    })
  }

  public function setRecordStatusError(inboundRecordPublicID : String, e : Exception) {
    var inbound = loadIRInboundRecord(inboundRecordPublicID)
    setRecordStatusError(inbound, e)
  }

  public function setRecordStatusError(inboundRecord : IRInboundRecord_ACC, e : Exception) {
    var error = getErrorString(e)
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      inboundRecord = bundle.add(inboundRecord)
      inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_ERROR)
      inboundRecord.setRuntimeMessage(error?.truncate(1300))
    })
  }


  public function setRecordStatusRetry(inboundRecord : IRInboundRecord_ACC, e : Exception) {
    var error = getErrorString(e)
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      inboundRecord = bundle.add(inboundRecord)
      inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_RETRY)
      inboundRecord.setRuntimeMessage(error?.truncate(1300))
    })
  }

  public function setRecordStatusNoAccount(inboundRecord : IRInboundRecord_ACC) {
    if (inboundRecord != null) {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        inboundRecord = bundle.add(inboundRecord)
        inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_NOACCOUNT)
      })
    }
  }

  public function setRecordStatusNoAccount(inboundRecords : List<IRInboundRecord_ACC>) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      for (inboundRecord in inboundRecords) {
        // ChrisA 5/04/2020 JUNO-3104 if this is a salary/wage earner; don't update skipped by system
        if (inboundRecord.Status != IRInboundRecordStatus_ACC.TC_NOACCOUNT
            and inboundRecord.Status != IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM) {
          inboundRecord = bundle.add(inboundRecord)
          inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_NOACCOUNT)
        }
      }
    })
  }

  public function setRecordStatusNoPolicy(inboundRecordPublicID : String) {
    var inboundRecord = loadIRInboundRecord(inboundRecordPublicID)
    setRecordStatusNoPolicy(inboundRecord)
  }

  public function setRecordStatusNoPolicy(inboundRecord : IRInboundRecord_ACC) {
    if (inboundRecord != null) {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        inboundRecord = bundle.add(inboundRecord)
        inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_NOPOLICY)
      })
    }
  }

  public function setRecordStatusSkipped(records : List<AbstractIRRecord>) {
    var inboundRecords = records.map(\record -> loadIRInboundRecord(record.InboundRecordPublicID))
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      for (inboundRecord in inboundRecords) {
        inboundRecord = bundle.add(inboundRecord)
        inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM)
      }
    })
  }

  //ChrisA 5/04/2020 JUNO-3104 if this is a salary/wage earner; set to skipped by system
  public function setRecordStatusSkippedBySystem(inboundRecord : IRInboundRecord_ACC) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      inboundRecord = bundle.add(inboundRecord)
      inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_SKIPPEDBYSYSTEM)
    })
  }

  public function setRecordStatusProcessed(bundle : Bundle, cregRecord : CREGRecord) {
    var inboundRecord = loadIRInboundRecord(cregRecord.InboundRecordPublicID)
    inboundRecord = bundle.add(inboundRecord)
    inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_PROCESSED)
    inboundRecord.setRuntimeMessage(null)
    inboundRecord.setNatureOfBusiness(cregRecord.NatureOfBusiness)
    inboundRecord.setEmployerClassification(cregRecord.EmployerClassification)
    inboundRecord.setEntityType(cregRecord.EntityType)
  }

  public function setRecordStatusProcessed(bundle : Bundle, cara4Record : CARA4Record) {
    var inboundRecord = loadIRInboundRecord(cara4Record.InboundRecordPublicID)
    inboundRecord = bundle.add(inboundRecord)
    inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_PROCESSED)
    inboundRecord.setRuntimeMessage(null)
    inboundRecord.setGrossEarnings(cara4Record.GrossEmployeeEarnings.toMonetaryAmount())
  }

  public function setRecordStatusProcessed(bundle : Bundle, cara5Record : CARA5Record) {
    var inboundRecord = loadIRInboundRecord(cara5Record.InboundRecordPublicID)
    inboundRecord = bundle.add(inboundRecord)
    inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_PROCESSED)
    inboundRecord.setRuntimeMessage(null)
    inboundRecord.setGrossEarnings(cara5Record.Remuneration.toMonetaryAmount())
  }

  public function setRecordStatusProcessed(bundle : Bundle, cara6Record : CARA6Record) {
    var inboundRecord = loadIRInboundRecord(cara6Record.InboundRecordPublicID)
    inboundRecord = bundle.add(inboundRecord)
    inboundRecord.setStatus(IRInboundRecordStatus_ACC.TC_PROCESSED)
    inboundRecord.setRuntimeMessage(null)
    inboundRecord.setGrossEarnings(cara6Record.GrossEarnings.toMonetaryAmount())
  }

  public function findAccount(accNumber : String) : Optional<Account> {
    return Optional.ofNullable(
        Query.make(Account)
            .compare(Account#ACCID_ACC, Relop.Equals, accNumber)
            .select()
            .AtMostOneRow)
  }

  public function checkIfFailedCregExists(accID : String) : Boolean {
    return Query.make(IRInboundRecord_ACC)
        .compare(IRInboundRecord_ACC#SequencerKey, Relop.Equals, accID)
        .compare(IRInboundRecord_ACC#IRExtRecordType_ACC, Relop.Equals, IRExtRecordType_ACC.TC_CREG1)
        .compare(IRInboundRecord_ACC#Status, Relop.Equals, IRInboundRecordStatus_ACC.TC_ERROR)
        .select()
        .getCountLimitedBy(1) > 0
  }

  private function getErrorString(e : Exception) : String {
    var sb = new StringBuilder()
    var stackTrace = e.StackTraceAsString?.truncate(500)
    if (GosuStringUtil.isNotBlank(e.Message)) {
      sb.append(e.Message)
      sb.append("\n")
    }
    if (GosuStringUtil.isNotBlank(stackTrace)) {
      sb.append(stackTrace)
    }
    return sb.toString()
  }
}