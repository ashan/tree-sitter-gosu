package edge.util

uses com.guidewire.pl.system.dependency.PLDependencies
uses edge.PlatformSupport.Locale

/**
 * Utilities for address related tasks.
*/
class AddressUtil {
  /**
   * Returns postal code pattern
   * @return postal code pattern for the default country or <code>null</code> if postal code pattern is
   *   not defined for the default country.
   */
  public static function getPostalCodePattern(): String {
    return PLDependencies.getAddressConfiguration().getAddressDefinition(Locale.DefaultCountry).getValidator("PostalCode").Value
  }
}
