package nz.co.acc.common.integration.files.inbound.utils

uses gw.api.database.Relop
uses gw.api.filters.StandardQueryFilter
uses org.w3c.css.sac.ElementSelector

uses java.text.SimpleDateFormat

/**
 * Created by Nithy on 18/05/2017.
 */
class InboundFileTypeFilter {

  private var _fileType: InbndFileMsgType_ACC
  private var _queryFilter: StandardQueryFilter as QueryFilter

  construct(fileType: InbndFileMsgType_ACC) {
    this._fileType = fileType
    this._queryFilter = new StandardQueryFilter(fileType.toString(),
        \query -> {
            query.compare("InbndFileMsgType", Relop.Equals, fileToType())
          })
  }

  private function fileToType(): InbndFileMsgType_ACC {
    var fileTypes = InbndFileMsgType_ACC.TF_FILETYPE.TypeKeys
    if(fileTypes.contains(_fileType))
      return _fileType
    else
      return null
  }
}