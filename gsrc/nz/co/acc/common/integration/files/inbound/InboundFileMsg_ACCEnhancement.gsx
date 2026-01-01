package nz.co.acc.common.integration.files.inbound

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * Created by fabianr on 12/01/2017.
 */
enhancement InboundFileMsg_ACCEnhancement: InbndFileMsg_ACC {

  property get FileInboundMessages(): IQueryBeanResult<FileInboundMessage_ACC> {
    var query = Query.make(FileInboundMessage_ACC)
        .compare("InbndFileMsg", Relop.Equals, this.ID)
    return query.select()
  }

  property get FileInboundMessagesErrorCount(): Integer {
    return this.FileInboundMessages.where(\elt -> elt.Status == FileInboundMsgStatus_ACC.TC_ERROR).Count
  }

  property get FileInboundMessagesProcessedCount(): Integer {
    return this.FileInboundMessages.where(\elt -> elt.Status == FileInboundMsgStatus_ACC.TC_DONE).Count
  }

}
