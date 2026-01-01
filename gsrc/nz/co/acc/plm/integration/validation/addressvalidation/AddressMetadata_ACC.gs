package nz.co.acc.plm.integration.validation.addressvalidation

uses gw.surepath.suite.integration.logging.StructuredLogger

uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * Contains a set of metadata related to an address
 */
class AddressMetadata_ACC {

  private var addressIdWithinExternalService: String as AddressIdWithinExternalService  // Address Identifier used by the external address service only
  private var alpha: String as Alpha
  private var boxType: String as BoxType    // The type of PO Box/CMB/Private Bag/Counter Delivery
  private var buildingName: String as BuildingName
  private var city: String as City
  private var dpid: String as Dpid // Unique reference number assigned to each delivery point address in the NZ Post PAF
  private var floor: String as Floor
  private var lobbyName: String as LobbyName // The name of the New Zealand Post outlet or Agency outlet where the PO Box, Private Bag or Counter Delivery is physically located.
  private var mailtown: String as Mailtown
  private var matched: Boolean as Matched // Specifies if the input matches an address (either phyisical or postal)
  private var meshblock: String as Meshblock
  private var number: String as Number
  private var physicalAddress: String as PhysicalAddress // Correctly formatted physical address
  private var postSuburb: String as PostSuburb
  private var postalAddress: String as PostalAddress  // Correctly formatted postal address
  private var postalLine1: String as PostalLine1
  private var postalLine2: String as PostalLine2
  private var postalLine3: String as PostalLine3
  private var postalLine4: String as PostalLine4
  private var postalLine5: String as PostalLine5
  private var postalLine6: String as PostalLine6
  private var postcode: String as Postcode
  private var region: String as Region
  private var rural: Boolean as Rural
  private var ruralDeliveryNumber: String as RuralDeliveryNumber // Rural Post – Rural Delivery route number
  private var street: String as Street
  private var streetType: String as StreetType
  private var suburb: String as Suburb
  private var sufi: Integer as Sufi   //	Static and Unique Feature Identifier is a unique identifiers from Land Information New Zealand (LINZ)
  private var territorialAuthority: String as TerritorialAuthority
  private var unitIdentifier: String as UnitIdentifier
  private var unitType: String as UnitType
  private var x: String as X  // Longitude in WGS84 format
  private var y: String as Y  // Latitude in WGS84 format

  // attributes used for the full address string breakdown
  private var addressLine1: String as AddressLine1
  private var addressLine2: String as AddressLine2
  private var addressLine3: String as AddressLine3
  private var addressLineCity: String as AddressLineCity


  /**
   * It returns a string with a list of all the object properties and their values
   *
   * @param showAll if true, the result includes also properties with null value
   * @return
   */
  function toString(showAll: boolean, separator: String): String {

    var result = new StringBuilder();
    //determine fields declared in this class only (no fields of superclass)
    var fields = this.getClass().getDeclaredFields();
    for (fieldToAdd in fields) {
      try {
        if (!showAll && fieldToAdd.get(this) == null) {
          continue
        }
        result.append(" ");
        result.append(fieldToAdd.getName());
        result.append(": ");
        //requires access to private field:
        result.append(fieldToAdd.get(this));
        result.append(separator);
      } catch (ex: IllegalAccessException) {
        StructuredLogger.INTEGRATION.error_ACC( this.getClass().getName() + " " + "toString" + " " + "Error while printing the content of the AddressMetadata_ACC object - " , ex)
      }
    }
    return result.toString();
  }

  /**
   * DE 33 - Determine if the physical and postal addresses are the same
   * @return
   */
  function isPhysicalAddressSameAsPostalAddress() : boolean {
    if (this.Dpid == null or this.Dpid == "") {
      // assume that if no postal address was found then they are the same.
      return true
    }
    return this.physicalAddress != null and this.postalAddress != null and this.physicalAddress == this.postalAddress
  }

  /**
   * DE 705 - Determine if the selected address is the same as the physical address
   * @return
   */
  function isSelectedAddressPhysical(address : String) : boolean {
    return address != null and this.physicalAddress != null and address == this.physicalAddress
  }

  /**
   * DE 705 - Determine if the box type exists
   * @return
   */
  property get BoxTypeExists() : boolean {
    return boxType != null and !boxType.isEmpty()
  }

  override function equals(obj: Object): boolean {
    return super.equals(obj)
        or (obj typeis AddressMetadata_ACC
        and obj.toString(true, "\n").equals(this.toString(true, "\n")))
  }


}
