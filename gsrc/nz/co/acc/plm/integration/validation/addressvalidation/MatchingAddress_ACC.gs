package nz.co.acc.plm.integration.validation.addressvalidation

/**
 * Represents a single matching address for the Autocomplete functionality
 */
public class MatchingAddress_ACC {

  var address: String as Address

  override function equals(obj: Object): boolean {
    return super.equals(obj)
        or (obj typeis MatchingAddress_ACC
        and obj.Address.equals(this.Address))
  }


}
