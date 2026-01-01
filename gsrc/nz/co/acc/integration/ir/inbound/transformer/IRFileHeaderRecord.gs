package nz.co.acc.integration.ir.inbound.transformer

interface IRFileHeaderRecord {
  property get IRInboundBatchID() : String

  property get ExternalKey() : String

  property get RunDate() : String
  
  property get IRInboundFeedType(): IRInboundFeedType_ACC
}