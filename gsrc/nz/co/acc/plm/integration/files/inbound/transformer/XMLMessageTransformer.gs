package nz.co.acc.plm.integration.files.inbound.transformer

uses nz.co.acc.common.integration.files.inbound.LineMessageTransformer
uses nz.co.acc.plm.integration.files.inbound.InboundPolicyUpdate

/**
 * Created by Nithy on 14/02/2017.
 */
abstract class XMLMessageTransformer  extends LineMessageTransformer {

  protected var _inboundPolicyUpdate: InboundPolicyUpdate as policyUpdate

  construct(msg: String) {
    super(msg)
  }

  construct(fileInboundMessage: FileInboundMessage_ACC) {
    super(fileInboundMessage);
  }

  function transform() : KeyableBean{
    return null
  }

  function transformData(): GNAInboundData_ACC {

    if (this._inboundPolicyUpdate != null) {
      var gnaInboundData = this._inboundPolicyUpdate.toEntity()
      return gnaInboundData
    }
    return null
  }


}