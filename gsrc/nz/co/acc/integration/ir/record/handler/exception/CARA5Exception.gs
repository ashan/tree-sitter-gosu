package nz.co.acc.integration.ir.record.handler.exception

/**
 * Exception thrown by CARA5 processor. Contains reference to
 * specific shareholder inbound record.
 * <p>
 * Created by Mike Ourednik on 17/02/2020.
 */
class CARA5Exception extends RuntimeException {

  var _inboundRecordPublicID : String as readonly InboundRecordPublicID

  public construct(inboundRecordPublicID : String, e : Exception) {
    super(e)
    _inboundRecordPublicID = inboundRecordPublicID
  }

}