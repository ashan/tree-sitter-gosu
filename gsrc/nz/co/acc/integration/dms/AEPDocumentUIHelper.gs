package nz.co.acc.integration.dms

uses gw.api.web.document.DocumentPCContext
uses gw.document.DocumentsActionsUIHelper

class AEPDocumentUIHelper {
  private var _isRelationshipManager = false
  private var _isAEPContractAccount = false

  public construct() {
  }

  public construct(account : Account) {
    if (account != null) {
      _isRelationshipManager = (account.RelationshipManager_ACC == User.util.CurrentUser)
      _isAEPContractAccount = account.AEPContractAccount_ACC
    }
  }

  public construct(context : DocumentPCContext) {
    this(context.Account_ACC)
  }

  public function filterVisibleCategories(categories : DocumentCategory_ACC[]) : List<DocumentCategory_ACC> {
    return categories
        .where(\category -> currentUserHasPermissionToViewCategory(category))
        .toList()
  }

  public function filterVisibleUploadDocumentTypes(docTypes : DocumentType[]) : List<DocumentType> {
    return docTypes
        .where(\docType -> currentUserHasPermissionToUploadDocumentType(docType))
        .toList()
  }

  public function currentUserHasPermissionToViewCategory(category : DocumentCategory_ACC) : boolean {
    if (category == DocumentCategory_ACC.TC_AEP) {
      return _isAEPContractAccount and (perm.System.aepdocumentadmin_acc or _isRelationshipManager)
    } else {
      return true
    }
  }

  public function currentUserHasPermissionToUploadDocumentType(documentType : DocumentType) : boolean {
    if (documentType.hasCategory(DocumentCategory_ACC.TC_AEP)) {
      if (not _isAEPContractAccount) {
        return false
      } else if (perm.System.aepdocumentadmin_acc) {
        return true
      } else if (_isRelationshipManager and documentType == DocumentType.TC_AEP_CONTRACT_ACC) {
        return true
      } else {
        return false
      }
    } else {
      return true
    }
  }

  public function currentUserHasPermissionToDeleteDocument(document : Document) : boolean {
    if (document.Type.hasCategory(DocumentCategory_ACC.TC_AEP)) {
      if (perm.System.aepdocumentadmin_acc) {
        return true
      } else {
        return _isRelationshipManager and document.Type == DocumentType.TC_AEP_CONTRACT_ACC
      }
    } else {
      // Took this code from DocumentsLV.pcf
      var ootbPermission = DocumentsActionsUIHelper.isDeleteDocumentLinkVisible(document)
          and DocumentsActionsUIHelper.isDeleteDocumentLinkAvailable(document)
      return ootbPermission
    }
  }

  public function currentUserHasPermissionToDownloadDocumentType(documentType : DocumentType) : boolean {
    if (documentType.hasCategory(DocumentCategory_ACC.TC_AEP)) {
      if (perm.System.aepdocumentadmin_acc) {
        return true
      } else {
        return _isRelationshipManager and documentType == DocumentType.TC_AEP_CONTRACT_ACC
      }
    } else {
      return true
    }
  }

  public function initializeDefaultVisibleDocumentTypes(searchCriteria : DocumentSearchCriteria) {
    var visisbleCategories = filterVisibleCategories(DocumentCategory_ACC.AllTypeKeys.toTypedArray())

    var visibleDocumentTypes = DocumentType.AllTypeKeys
        .where(\docType -> visisbleCategories.hasMatch(\cat -> docType.hasCategory(cat)))
        .toTypedArray()

    var typeWrappers = createDocumentSearchTypes(visibleDocumentTypes)

    searchCriteria.TypeWrappers = typeWrappers
  }

  public function updateSearchCriteria(searchCriteria : DocumentSearchCriteria, category : DocumentCategory_ACC) {
    if (category == null) {
      initializeDefaultVisibleDocumentTypes(searchCriteria)
    } else {
      var docTypes = DocumentType.AllTypeKeys
          .where(\docType -> docType.hasCategory(category) and currentUserHasPermissionToViewCategory(category))
          .toTypedArray()
      var typeWrappers = createDocumentSearchTypes(docTypes)
      searchCriteria.TypeWrappers = typeWrappers
    }
  }

  private function createDocumentSearchTypes(documentTypes : DocumentType[]) : DocumentSearchTypeWrapper[] {
    return documentTypes.map(\type -> {
      var wrapper = new DocumentSearchTypeWrapper()
      wrapper.setDocumentType(type)
      return wrapper
    })
  }

}