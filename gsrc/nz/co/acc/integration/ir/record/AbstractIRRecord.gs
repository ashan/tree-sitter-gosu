package nz.co.acc.integration.ir.record

/**
 * Created by Mike Ourednik on 21/01/2020.
 */
abstract class AbstractIRRecord {
  var inboundRecordPublicID : String as InboundRecordPublicID
  var business_accNumber: String as AccNumber
}