package nz.co.acc.plm.integration.instruction.util

uses java.text.SimpleDateFormat

/**
 * Define all Instruction related constants and properties
 */
class InstructionConstantHelper {

  public static final var NEW_LINE: String = System.lineSeparator()
  public static final var CSV_DELIMITER: String = ","

  public static final var DATE_FORMAT_PATTERN_yMd : String = "yyyyMMdd"
  public static final var DATE_FORMAT_yMd : SimpleDateFormat
          = new SimpleDateFormat(DATE_FORMAT_PATTERN_yMd)

  public static final var DATE_FORMAT_PATTERN_dMYHm : String = "dd/MM/yyyy HH:mm"
  public static final var DATE_FORMAT_dMYHm : SimpleDateFormat
      = new SimpleDateFormat(DATE_FORMAT_PATTERN_dMYHm)

  public static final var PRODUCTKEY_WPC: String = "E"
  public static final var PRODUCTKEY_WPS: String = "D"
  public static final var PRODUCTKEY_CP: String = "S"

  public static final var MODIFIER_SURFIX_PROGRAMME: String = "ExpRatingProgramme"
  public static final var MODIFIER_SURFIX_RUNNUMBER: String = "ExpRatingProgrammeRunNumber"
  public static final var MODIFIER_SURFIX_RATE: String = "ExpRatingProgrammeModRate"
  public static final var MODIFIER_SURFIX_MANUALREQUEST: String = "ExpRatingProgrammeManualRequest"
  public static final var MODIFIER_SURFIX_CALCTYPECODE: String = "ExpRatingProgrammeCalcTypeCode"

  public static final var JOB_AUDIT: String = "Audit"
  public static final var JOB_POLICYCHANGE: String = "ModifierChange"

  public static final var PROGRAMME_KEY_STANDARD: String = "STD"
  public static final var PROGRAMME_KEY_EXPERIENCERATING: String = "ER"
  public static final var PROGRAMME_KEY_NOCLAIMSDISCOUNT: String = "NCD"

  public static final var ACTION_EXIT: String = "Exit"
  public static final var ACTION_ENTRY: String = "Entry"

}