package edge.capabilities.policychange.lob.personalauto.draft.util

class LocationUtil {

  static function createFromPolicyAddress(period:PolicyPeriod) : PolicyLocation {
    var newLocation = period.newLocation()

    // Address object does not exist in PolicyLocation so set fields individually
    newLocation.AddressLine1 = period.PolicyAddress.AddressLine1
    newLocation.AddressLine1Kanji = period.PolicyAddress.AddressLine1Kanji
    newLocation.AddressLine2 = period.PolicyAddress.AddressLine2
    newLocation.AddressLine2Kanji = period.PolicyAddress.AddressLine2Kanji
    newLocation.AddressLine3 = period.PolicyAddress.AddressLine3
    newLocation.City = period.PolicyAddress.City
    newLocation.CityKanji = period.PolicyAddress.CityKanji
    newLocation.County = period.PolicyAddress.County
    newLocation.State = period.PolicyAddress.State
    newLocation.PostalCode = period.PolicyAddress.PostalCode

    return newLocation
  }
  
}
