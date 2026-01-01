package nz.co.acc.common.integration.files.outbound

uses gw.api.gx.GXOptions
uses gw.api.system.database.SequenceUtil
uses gw.pl.currency.MonetaryAmount
uses gw.pl.persistence.core.Bundle
uses gw.xml.XmlSerializationOptions

/**
 * All messages to be captured for the Stage 1 Outbound framework should implement this base action
 * class.
 * It is important to implement this action and to follow same pattern for all messages.
 * <p>
 * Created by Nick on 13/01/2017.
 */
abstract class FullCapturableData {

  private var _recordType: OutBoundRecordType_ACC as RecordType
  private var _recordStatus: OutBoundRecordStatus_ACC as RecordStatus
  private var _gxOpts: GXOptions as GxOpts
  private var _xmlOpts: XmlSerializationOptions as XmlOpts
  private var _actionBundle: Bundle as ActionBundle

  construct(type: OutBoundRecordType_ACC, bundle: Bundle) {
    _recordType = type
    _recordStatus = OutBoundRecordStatus_ACC.TC_NEW
    _xmlOpts = new XmlSerializationOptions()
    _xmlOpts.XmlDeclaration = false
    _xmlOpts.Sort = false
    _xmlOpts.Validate = false
    _gxOpts = new GXOptions()
    _gxOpts.Incremental = false
    _gxOpts.Verbose = false
    _gxOpts.SuppressExceptions = false
    _actionBundle = bundle
  }

  construct(bundle: Bundle) {
    _recordStatus = OutBoundRecordStatus_ACC.TC_NEW
    _xmlOpts = new XmlSerializationOptions()
    _xmlOpts.XmlDeclaration = false
    _xmlOpts.Sort = false
    _xmlOpts.Validate = false
    _gxOpts = new GXOptions()
    _gxOpts.Incremental = false
    _gxOpts.Verbose = false
    _gxOpts.SuppressExceptions = false
    _actionBundle = bundle
  }
  /**
   * This method is to create a NEW basic outbound record
   *
   * @param accountNumber
   * @param entityName
   * @param entityID
   * @param data
   * @param amount
   * @return
   */
  function newRecord(accountNumber: String, entityName: String, entityID: Long, data: String, amount: MonetaryAmount): OutBoundRecord_ACC {
    var outboundRecord = new OutBoundRecord_ACC(ActionBundle)
    outboundRecord.Status = RecordStatus
    outboundRecord.Type = RecordType
    outboundRecord.AccountNumber = accountNumber
    outboundRecord.OriginEntityName = entityName
    outboundRecord.OriginEntityID = entityID
    outboundRecord.Data = data
    outboundRecord.Amount = amount
    outboundRecord.LetterID = SequenceUtil.next(10000, "Mailhouse_Letter_ID")
    return outboundRecord
  }

  /**
   * This method is to create a NEW basic outbound record with a hashtotal
   *
   * @param accountNumber
   * @param entityName
   * @param entityID
   * @param data
   * @param amount
   * @param hashTotal
   * @return
   */
  function newRecord(accountNumber: String, entityName: String, entityID: Long, data: String, amount: MonetaryAmount, hashTotal: long): OutBoundRecord_ACC {
    var newRecord = newRecord(accountNumber, entityName, entityID, data, amount)
    newRecord.HashTotal = hashTotal
    return newRecord
  }

  /**
   * This method is to create a NEW basic outbound record with a policy number
   *
   * @param accountNumber
   * @param entityName
   * @param entityID
   * @param data
   * @param amount
   * @param policyNumber
   * @return
   */
  function newRecord(accountNumber: String, entityName: String, entityID: Long, data: String, amount: MonetaryAmount, policyNumber: String): OutBoundRecord_ACC {
    var newRecord = newRecord(accountNumber, entityName, entityID, data, amount)
    newRecord.PolicyNumber = policyNumber
    return newRecord
  }

  /**
   * This method is to create a new basic outbound record with policy number and policy address type
   *
   * @param accountNumber
   * @param entityName
   * @param entityID
   * @param data
   * @param amount
   * @param policyNumber
   * @param policyAddressType
   * @return
   */
  function newRecord(accountNumber: String, entityName: String, entityID: Long, data: String, amount: MonetaryAmount, policyNumber: String, policyAddressType: String): OutBoundRecord_ACC {
    var newRecord = newRecord(accountNumber, entityName, entityID, data, amount, policyNumber)
    newRecord.PolicyAdressType = policyAddressType
    return newRecord
  }


  /**
   * This method is to create a new outbound record with policy number, policy address type and a reference
   * used by arranged payment plan letters, reference is arranged payment plan sequence number
   * used by payment plan letters, reference is invoice number
   *
   * @param accountNumber
   * @param entityName
   * @param entityID
   * @param data
   * @param amount
   * @param policyNumber
   * @param policyAddressType
   * @param reference
   * @return
   */
  function newRecord(accountNumber: String, entityName: String, entityID: Long, data: String, amount: MonetaryAmount, policyNumber: String, policyAddressType: String, reference: String): OutBoundRecord_ACC {
    var newRecord = newRecord(accountNumber, entityName, entityID, data, amount, policyNumber, policyAddressType)
    newRecord.Reference = reference
    return newRecord
  }

  /**
   * This must be implemented so that we can capture the initial outbound message.
   * <p>
   * Note, if this method is called from a user transaction (e.g. Pre-update rule) then it should not perform any heavy work like capture large amounts of data,
   * as it will hold the user response time.
   * <p>
   * Instead, capture partial data here and return, and allow for the capturePartialToFullData(), a non-user transaction, to capture the rest of the data.
   *
   * @param entity
   * @return The OutboundRecord_ACC instance with initial state and data captured.
   */
  abstract function captureFull(entity: KeyableBean)

  /**
   * Any OutBound Record where refreshing the Data is needed should implement this interface in their CapturableData.
   *
   * @param bundle
   * @param outboundRecord
   * @return
   */
  function refreshData(bundle: Bundle, outboundRecord: OutBoundRecord_ACC): OutBoundRecord_ACC {
    return outboundRecord
  }

}
