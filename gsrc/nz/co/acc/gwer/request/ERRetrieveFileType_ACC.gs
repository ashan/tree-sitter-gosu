package nz.co.acc.gwer.request

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
//uses nz.co.acc.erV2.dbconnectionhandler.ERDatabaseController_ACC
//uses nz.co.acc.erV2.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.gwer.uploadfiles.ParamFileTypes_ACC


uses java.io.Serializable


class ERRetrieveFileType_ACC implements Serializable {

  private static final var SQL_LABEL_FILE_TYPE_ID = "FileTypeID"
  private static final var SQL_LABEL_FILE_TYPES = "FileType"
  private static final var SQL_LABEL_SUPPORTED_EXTENSIONS = "SupportedExtensions"
  private static var _logger = StructuredLogger.INTEGRATION.withClass(ERRetrieveFileType_ACC)

  private var _fileTypes : ParamFileTypes_ACC as FileTypes

  function retrieveFileTypes() : ParamFileTypes_ACC {
    _fileTypes = new ParamFileTypes_ACC()

//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.RetrieveFileType)
//      executeQuery()
//
//      while(rs.next()) {
//        _fileTypes.ID.add(rs.getInt(SQL_LABEL_FILE_TYPE_ID))
//        _fileTypes.Names.add(rs.getString(SQL_LABEL_FILE_TYPES))
//        _fileTypes.Extensions.add(rs.getString(SQL_LABEL_SUPPORTED_EXTENSIONS))
//      }
//      return _fileTypes
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e )
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
    return _fileTypes
  }

  function retrieveAllFileTypes() : ParamFileTypes_ACC {

    var allFileTypes = new ParamFileTypes_ACC()

//    try {
//      makeDbConnection()
//      createDbStatement(StoreProcNames_ACC.RetrieveAllExtensionTypes)
//      executeQuery()
//
//      while(rs.next()) {
//        allFileTypes.ID.add(rs.getInt(SQL_LABEL_FILE_TYPE_ID))
//        allFileTypes.Names.add(rs.getString(SQL_LABEL_FILE_TYPES))
//        allFileTypes.Extensions.add(rs.getString(SQL_LABEL_SUPPORTED_EXTENSIONS))
//      }
//      return allFileTypes
//    }
//    catch(e : Exception) {
//      _logger.error_ACC(storeProcData.ProcName, e)
//      if(e typeis DisplayableException) {
//        throw e
//      }
//      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
//    }
//    finally {
//      closeDbConnection()
//    }
    return allFileTypes
  }

  override function toString(): String {
    return this.FileTypes.toString()
  }
}