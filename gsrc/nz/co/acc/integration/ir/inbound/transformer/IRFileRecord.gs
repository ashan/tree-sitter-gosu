package nz.co.acc.integration.ir.inbound.transformer

interface IRFileRecord {
  property get AccNumber() : String

  property get RecordType() : IRExtRecordType_ACC

  function generatePayload() : String
}