package nz.co.acc.er.documentrequest

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.surepath.suite.integration.logging.StructuredLogger
uses nz.co.acc.er.ERPersistenceUtil_ACC
uses nz.co.acc.er.dbconnectionhandler.ERDatabaseController_ACC
uses nz.co.acc.er.dbconnectionhandler.StoreProcNames_ACC
uses nz.co.acc.plm.util.db.ERDatabaseConnectionHelper

uses java.sql.CallableStatement
uses java.sql.Connection
uses java.sql.ResultSet
uses java.sql.SQLException
uses java.sql.Types

class DocumentRequestController_ACC extends ERDatabaseController_ACC {
  private static var _logger = StructuredLogger.INTEGRATION.withClass(DocumentRequestController_ACC)

  private var _documentType : String as DocumentType = null

  private var _successMessage : String as SuccessMessage = null

  construct(docType : String) {
    _documentType = docType
  }

  property get DocumentTypes() : DocumentTypeDetails_ACC[] {

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.ListDocumentTypes)
      stmt.setString(1, _documentType)
      executeQuery()
      var list = new ArrayList<DocumentTypeDetails_ACC>()
      while(rs.next()) {
        list.add(new DocumentTypeDetails_ACC() {
          :DocumentTypeID = rs.getInt("DocumentTypeID"),
          :DocumentType = rs.getString("DocumentType"),
          :DocumentSubTypeID = rs.getInt("DocumentSubTypeID"),
          :DocumentSubType = rs.getString("DocumentSubType"),
          :DocumentSubTypeDisplayName = rs.getString("DocumentSubTypeDisplayName"),
          :SortOrder = rs.getInt("SortOrder")
        })
      }
      return list.toTypedArray()
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }

  }

  function generateLettersRequest(docTypeDetails : DocumentTypeDetails_ACC,
                                  nextLevyYear : Integer) {

    _successMessage = null

    if (docTypeDetails == null) {
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.GroupStructureLetters.Validation.LetterTypeIsNull_ACC"))
    }

    try {
      makeDbConnection()
      createDbStatement(StoreProcNames_ACC.AddERDocuments)
      stmt.setInt(1, docTypeDetails.DocumentTypeID)
      stmt.setInt(2, docTypeDetails.DocumentSubTypeID)
      stmt.setString(3, "Pending")
      stmt.setInt(4, nextLevyYear)
      stmt.setNull(5, Types.INTEGER)
      stmt.setNull(6, Types.VARCHAR)
      stmt.setString(7, User.util.CurrentUser.Credential.UserName)
      if (User.util.CurrentUser.Contact.EmailAddress1 != null) {
        stmt.setString(8, User.util.CurrentUser.Contact.EmailAddress1)
      } else {
        stmt.setNull(8, Types.VARCHAR)
      }
      executeStatement()
      _successMessage = DisplayKey.get("Web.ExperienceRating.GroupStructureLetters.SuccessMessage_ACC")
    }
    catch(e : Exception) {
      _logger.error_ACC(storeProcData.ProcName, e)
      if(e typeis DisplayableException) {
        throw e
      }
      throw new DisplayableException(DisplayKey.get("Web.ExperienceRating.Error_ACC", storeProcData.ProcName))
    }
    finally {
      closeDbConnection()
    }

  }

}