package nz.co.acc.plm.integration.bulkupload

uses gw.api.locale.DisplayKey

/**
 * Created by andersc3 on 27/01/2020.
 */
class PCBulkUpLoadUIHelper {

  function getHeaderRowLabels(selectedUploadType : BulkUploadType_ACC) : String {
    final var prefix = DisplayKey.get("Web.Admin.BulkUpload_ACC.Label.HeaderRowPrefix") + " "
    if (selectedUploadType == BulkUploadType_ACC.TC_REMOVECONTACTDETAILS) {
      return prefix.concat(DisplayKey.get("Web.Admin.BulkUpload_ACC.Label.BulkRemoveContactDetails"))
    } /*else if (selectedUploadType == BulkUploadType_ACC.TC_WRITEOFF) {
      headerRow = headerRow.concat(DisplayKey.get("Web.Admin.BulkUpload_ACC.Label.BulkWriteOffs"))
    } else if (selectedUploadType == BulkUploadType_ACC.TC_DEBITTRANSACTIONS) {
      headerRow = headerRow.concat(DisplayKey.get("Web.Admin.BulkUpload_ACC.Label.BulkDebitTransactions"))
    }*/ else {
      return null
    }
  }
}