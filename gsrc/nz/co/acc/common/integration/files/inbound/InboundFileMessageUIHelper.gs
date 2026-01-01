package nz.co.acc.common.integration.files.inbound

uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.filters.StandardQueryFilter

uses nz.co.acc.common.integration.files.inbound.utils.InboundFileTypeFilter
uses nz.co.acc.common.integration.files.inbound.utils.InboundMonthlyFilter

uses java.text.DateFormatSymbols


/**
 * Created by fabianr on 9/12/2016.
 */
class InboundFileMessageUIHelper {

  public function getInbndFileMessages(): IQueryBeanResult<InbndFileMsg_ACC> {
    var fileTypes = InbndFileMsgType_ACC.TF_FILETYPE.TypeKeys
    var query = Query.make(InbndFileMsg_ACC).compareIn("InbndFileMsgType", fileTypes.toArray() )
    return query.select()
  }

  public function findFileInboundMessages(inboundFile: InbndFileMsg_ACC): IQueryBeanResult<FileInboundMessage_ACC> {
    var query = Query.make(FileInboundMessage_ACC).compare("InbndFileMsg", Relop.Equals, inboundFile.ID)
    return query.select()
  }

  public function findFileInboundMessageById(publicId: String): FileInboundMessage_ACC {
    var query = Query.make(FileInboundMessage_ACC).compare("PublicID", Relop.Equals, publicId)
    return query.select().AtMostOneRow
  }

  public function recordHistory(fileMessage: FileInboundMessage_ACC) {
    var bundle = gw.transaction.Transaction.getCurrent()
    var orginalFileMessage = gw.api.database.Query.make(FileInboundMessage_ACC).compare("PublicID", Equals, fileMessage.PublicID).select().AtMostOneRow
    if (orginalFileMessage.Message != fileMessage.Message) {
      fileMessage.Status = FileInboundMsgStatus_ACC.TC_NEW
      fileMessage.Processed = 0
      fileMessage.LastUpdatedBy = User.util.CurrentUser.toString()
      bundle.add(fileMessage)
      var history = new FileInbndMsgHistory_ACC()
      history.Message = orginalFileMessage.Message
      history.LastUpdatedBy = orginalFileMessage.LastUpdatedBy != null ? orginalFileMessage.LastUpdatedBy : orginalFileMessage.CreateUser.toString()
      history.FileInboundMessage = fileMessage
      bundle.add(history)
    }
  }

  public function getMonthlyFilterOptions(): StandardQueryFilter[] {
    var filterOptions = new StandardQueryFilter[12];
    var months = new DateFormatSymbols().getMonths();
    for (i in 0..11) {
      filterOptions[i] = new InboundMonthlyFilter(months[i]).QueryFilter
    }
    return filterOptions
  }

  public function getFiletypeFilterOptions(): StandardQueryFilter[] {
    var fileTypes = InbndFileMsgType_ACC.TF_FILETYPE.TypeKeys
    var filterOptions = new StandardQueryFilter[fileTypes.size()];
    for(i in fileTypes index i1) {
      filterOptions[i1] = new InboundFileTypeFilter(i).QueryFilter
    }
    return filterOptions
  }

}

