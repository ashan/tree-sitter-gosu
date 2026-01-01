package nz.co.acc.plm.integration.bulkupload.csvtypes.contact

uses gw.api.util.phone.GWPhoneNumber

/**
 * Fields common between Company and Person contact entities
 *
 * Created by OurednM on 20/06/2018.
 */
abstract class IContactCommonFields {

  public var irNumber: String as IRNumber = null
  public var accNumber: String as ACCNumber = null

  public var primaryPhoneType: PrimaryPhoneType as PrimaryPhoneType = null
  public var homePhone: GWPhoneNumber as HomePhone = null
  public var workPhone: GWPhoneNumber as WorkPhone = null
  public var cellPhone: GWPhoneNumber as CellPhone = null
  public var faxPhone: GWPhoneNumber as FaxPhone = null

  public var primaryEmail: String as PrimaryEmail = null
  public var secondaryEmail: String as SecondaryEmail = null

  public var country: Country as Country = null
  public var attention: String as Attention = null
  public var address1: String as Address1 = null
  public var address2: String as Address2 = null
  public var address3: String as Address3 = null
  public var city: String as City = null
  public var postalCode: String as PostalCode = null
  public var addressValidUntil: Date as ValidUntil = null
  public var addressType: AddressType as AddressType = null
  public var addressLocationType: AddressLocationType_ACC as AddressLocationType = null

}