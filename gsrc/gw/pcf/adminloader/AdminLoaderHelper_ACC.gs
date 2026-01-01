package gw.pcf.adminloader

uses com.guidewire.modules.key.SingleFileKey
uses edge.util.helper.UserUtil
uses gw.api.system.PCLoggerCategory
uses gw.transaction.*
uses nz.co.acc.common.sampledata.SampleDataWebFile_ACC


/**
 * Created by eliyaz on 1/09/2017.
 */
class AdminLoaderHelper_ACC {
  private static final var DATAFILES_PATH = "config/datafiles/"
  private static final var GEN_PATH = "config/import/gen/"

  private static final var ADMIN_LOADER_ADMIN_XML_FILE_NAME = "admin.xml"
  private static final var ADMIN_LOADER_UW_GWRULES_FILE_NAME = "UWRule_ACC.gwrules"

  private static final var ADMIN_LOADER_XML_FILE_CONTENT_TYPE = "text/xml"
  private static final var ADMIN_LOADER_GW_RULES_CONTENT_TYPE = "application/zip"

  public static function getWebFileForAdminData(): SampleDataWebFile_ACC {
    var fileKey: SingleFileKey = null
    if (SingleFileKey.get(ADMIN_LOADER_ADMIN_XML_FILE_NAME) == null) {
      // lazy load
      fileKey = new SingleFileKey(ADMIN_LOADER_ADMIN_XML_FILE_NAME, GEN_PATH + ADMIN_LOADER_ADMIN_XML_FILE_NAME, null, true, false, "ALL XML File")
    } else {
      fileKey = SingleFileKey.get(ADMIN_LOADER_ADMIN_XML_FILE_NAME) as SingleFileKey
    }
    var allXMLFile = fileKey.File
    return new SampleDataWebFile_ACC(allXMLFile, ADMIN_LOADER_ADMIN_XML_FILE_NAME, ADMIN_LOADER_XML_FILE_CONTENT_TYPE)
  }

  public static function getWebFileForUWGWRules(): SampleDataWebFile_ACC {
    var fileKey: SingleFileKey = null
    if (SingleFileKey.get(ADMIN_LOADER_UW_GWRULES_FILE_NAME) == null) {
      // lazy load
      fileKey = new SingleFileKey(ADMIN_LOADER_UW_GWRULES_FILE_NAME, DATAFILES_PATH + ADMIN_LOADER_UW_GWRULES_FILE_NAME, null, true, false, "UW GW RULES")
    } else {
      fileKey = SingleFileKey.get(ADMIN_LOADER_UW_GWRULES_FILE_NAME) as SingleFileKey
    }
    var allXMLFile = fileKey.File
    return new SampleDataWebFile_ACC(allXMLFile, ADMIN_LOADER_UW_GWRULES_FILE_NAME, ADMIN_LOADER_GW_RULES_CONTENT_TYPE)
  }

  public static function addUWProfilesToUsers() {
    try {
      gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
        UserUtil.addUWAutorityProfilesToUser(bundle, UserUtil.getUserByName("renewal_daemon"), {"Audit - DFA5", "DFA5", "CPX Underwriter manager"})
        UserUtil.addUWAutorityProfilesToUser(bundle, UserUtil.getUserByName("policychange_daemon"), {"Audit - DFA5", "DFA5", "CPX Underwriter manager"})
        UserUtil.addUWAutorityProfilesToUser(bundle, UserUtil.getUserByName("sys"), {"Audit - DFA5", "DFA5", "CPX Underwriter manager"})
      });

    } catch (e) {
      //catch the duplicate exception here, they have already been assigned
      if (e.Cause typeis com.guidewire.pl.system.exception.DBDuplicateKeyException) {
        PCLoggerCategory.APPLICATION.warn("AdminLoaderHelper_ACC.addUWProfilesToUsers() - Admin Loader already assigned UW profiles to users")
      } else {
        throw e
      }
    }
  }

}