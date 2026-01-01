package nz.co.acc.common

/**
 * For system wide constants that can be reused.
 *
 * Created by Kaushalya Samarasekera on 12/06/2017.
 */
class GenericConstants {

  /**
   * Date/Time pattern to output or parse a date time value to or from following format.
   * e.g. 2017-06-23T14:41:53.297+1200
   */
  public static final var ISO8601_TIMESTAMP_PATTERN: String = "yyyy-MM-dd'T'HH:mm:ss.SSSXX"

  /**
   * This filler is used for the dummy addresses to initialise the address fields.
   */
  public static final var DUMMY_ADDRESS_FILLER: String = "Unknown"

}