package nz.co.acc.integration.ir.record.util

/**
 * Created by Mike Ourednik on 30/01/2020.
 */
class IRConstants {

  // Employer classification values
  public static final var EMPLOYER_CLASSIFICATION_EMPLOYER : String = "O"
  public static final var EMPLOYER_CLASSIFICATION_INDIVIDUAL : String = "I"
  public static final var EMPLOYER_CLASSIFICATION_SELF_EMPLOYED : String = ""

  // Used by both account & policy create.
  public static final var ENTITY_TYPE_INDIVIDUAL : String = "I"

  // V and D are both valid statuses
  public static final var VALID_ADDRESS_STATUS1 : String = "V"
  public static final var VALID_ADDRESS_STATUS2 : String = "D"
  public static final var ADDRESS_OVERSEAS_STATUS : String = "O"

  // U and I are both taken to be invalid and treated the same
  public static final var ADDRESS_UNKNOWN_STATUS : String = "U"
  public static final var ADDRESS_INVALID_STATUS : String = "I"

  // Possible end reason status codes
  public static final var STATUS_BANKRUPT: String = "BN"
  public static final var STATUS_DECEASED: String = "DC"
  public static final var STATUS_REMOVED: String = "SO"
}