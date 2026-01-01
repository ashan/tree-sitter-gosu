package nz.co.acc.plm.integration.bulkupload

uses nz.co.acc.common.integration.bulkupload.AbstractBulkUploader
uses nz.co.acc.common.integration.bulkupload.BulkUploadProcessUpdater
uses nz.co.acc.common.integration.bulkupload.csvprocessor.AbstractCSVProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkAccountStatusProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkCompleteCancelActivityProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkContactProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkContactRelationshipProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkCorrespondenceDetailsProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkCreateActivitiesProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkInvalidateContactDetailsProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkMigratedHoldsProcessor
uses nz.co.acc.plm.integration.bulkupload.csvprocessor.BulkRemoveContactDetailsProcessor
uses nz.co.acc.gwer.bulkupload.processor.BulkBusinessGroupProcessor
uses org.apache.commons.lang.NotImplementedException

uses java.io.File

/**
 * Handles an uploaded CSV file and starts the process of importing contacts.
 * <p>
 * Created by OurednM on 13/06/2018.
 * ChrisA 02/10/2018 US12192 process Migrated Policy Holds
 */
class BulkUploader extends AbstractBulkUploader {
  construct(uploadFile : File, uploadFileName : String, bulkUploadType : BulkUploadType_ACC) {
    super(uploadFile, uploadFileName, bulkUploadType)
  }

  override protected function getCSVProcessor(
      bulkUploadType : BulkUploadType_ACC,
      updater : BulkUploadProcessUpdater,
      uploadFile : File) : AbstractCSVProcessor {

    var importer : AbstractCSVProcessor

    if (bulkUploadType == BulkUploadType_ACC.TC_COMPANYCONTACT) {
      importer = BulkContactProcessor.companyContactImporter(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_PERSONCONTACT) {
      importer = BulkContactProcessor.personContactImporter(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_COMPANYCONTACTRELATIONSHIP) {
      importer = BulkContactRelationshipProcessor.companyContactRelationshipAdder(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_REMOVECOMPANYCONTACTRELATIONSHIP) {
      importer = BulkContactRelationshipProcessor.companyContactRelationshipDeleter(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_PERSONCONTACTRELATIONSHIP) {
      importer = BulkContactRelationshipProcessor.personContactRelationshipAdder(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_REMOVEPERSONCONTACTRELATIONSHIP) {
      importer = BulkContactRelationshipProcessor.personContactRelationshipDeleter(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_MIGRATEDPOLICYHOLDS) {
      importer = BulkMigratedHoldsProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_CREATEACTIVITIES) {
      importer = BulkCreateActivitiesProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_COMPLETECANCELACTIVITIES) {
      importer = BulkCompleteCancelActivityProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_ACCOUNTSTATUS) {
      importer = BulkAccountStatusProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_REMOVECONTACTDETAILS) {
      importer = BulkRemoveContactDetailsProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_CORRESPONDENCEDETAILS) {
      importer = BulkCorrespondenceDetailsProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_INVALIDATECONTACTDETAILS) {
      importer = BulkInvalidateContactDetailsProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_BUSINESSGROUPS) {
      importer = BulkBusinessGroupProcessor.newInstance(updater, uploadFile)
    } else if (bulkUploadType == BulkUploadType_ACC.TC_ACTUARIALPARAMETERS) {
      importer = BulkBusinessGroupProcessor.newInstance(updater, uploadFile)
    } else {
      throw new NotImplementedException(bulkUploadType.toString())
    }

    return importer
  }

}