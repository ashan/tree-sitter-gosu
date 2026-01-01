package nz.co.acc.plm.integration.ir.util

uses gw.api.util.ConfigAccess

/**
 * Define all IR related constants and properties
 */
class ConstantPropertyHelper {

  public static final var NEW_LINE: String = System.lineSeparator()
  public static final var PROP_SEPERATOR: String = "."

  public static final var STUB_SURFIX: String = ".stub"
  public static final var SCHEMA_SURFIX: String = ".schema"
  public static final var SCHEMA_DATAPOINT: String = "DataPoints"

  public static final var SCHEMA_COMMENT: String = "#"

  public static final var CSV_DELIMITER: String = ","

  public static final var PAYLOAD_ERROR_PREFIX: String = "[PE]${NEW_LINE}"
  public static final var BUSINESS_ERROR_PREFIX: String = "[BE]${NEW_LINE}"
  public static final var RUNTIME_ERROR_PREFIX: String = "[RE]${NEW_LINE}"

  public static final var IR_EXTERNAL_KEY_PREFIX: String = "EK-"

  public static final var SEQUENCE_BATCH: String = "SEQ_IRInboundBatch_ACC"
  public static final var SEQUENCE_INBOUND: String = "SEQ_IRInboundRecord_ACC"
  public static final var SEQUENCE_EXTERNALKEY: String = "SEQ_IRRecExternalKey_ACC"
  public static final var SEQUENCE_LEGACY_EMPLOYER_ID: String = "SEQ_LegacyEmployerID_ACC"
  public static final var SEQUENCE_POLICYNUMBER: String = "SEQ_PolicyNumber_ACC"

  public static final var FLAG_YES: String = "Yes"
  public static final var FLAG_NO: String = "No"
  public static final var FLAG_ALL: String = "All"

  public static final var DATE_FORMAT_yMd: String = "yyyyMMdd"
  public static final var DATE_FORMAT_dMYHmsS: String = "dd/MM/yyyy HH:mm:ss:SSS"
  public static final var DATE_FORMAT_dMYHms: String = "dd/MM/yyyy HH:mm:ss"
  public static final var DATE_FORMAT_yyyyMMdd: String = "yyyy-MM-dd"

  public static final var OVERRIDECONTROL_ALL: String = "All"
  public static final var OVERRIDECONTROL_NONE: String = "None"
  public static final var OVERRIDECONTROL_REGONLY: String = "RegistrationOnly"

  public static final var PRODUCTCODE_WPC: String = "EmployerACC"
  public static final var PRODUCTCODE_WPS: String = "ShareholdingCompany"
  public static final var PRODUCTCODE_CP: String = "IndividualACC"
  public static final var PRODUCTCODE_AEP: String = "AccreditedEmployersProgramme"


  /**
   * The Stub Folder
   */
  public property get StubsFolder(): String {
    return "${getRoot()}/config/import/ir/stubs/"
  }

  /**
   * The Export Folder
   */
  public property get ExportFolder(): String {
    return "${getRoot()}/config/import/ir/export/"
  }

  /**
   * The Schema Folder
   */
  public property get SchemaFolder(): String {
    return "${getRoot()}/config/import/ir/import/"
  }

  /**
   * Returns the absolute path to the configuration module of this guidewire application.
   */
  private function getRoot(): String {
    return ConfigAccess.getModuleRoot("configuration").getAbsolutePath()
  }

}
