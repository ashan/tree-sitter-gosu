package nz.co.acc.plm.integration.bulkupload.csvtypes.contact

/**
 * Data object for a Person contact CSV row.
 *
 * Created by OurednM on 14/06/2018.
 */
class PersonContact extends IContactCommonFields {

  var title: NamePrefix as Title
  var firstName: String as FirstName
  var middleName: String as MiddleName
  var lastName: String as LastName
  var gender: GenderType as Gender
  var dateOfBirth: Date as DateOfBirth

  override function toString(): String {
    return "PersonContact{" +
        "title='" + title + '\'' +
        ", firstName='" + firstName + '\'' +
        ", middleName='" + middleName + '\'' +
        ", lastName='" + lastName + '\'' +
        ", gender='" + gender + '\'' +
        ", dateOfBirth='" + dateOfBirth + '\'' +
        ", irNumber='" + irNumber + '\'' +
        ", accNumber='" + accNumber + '\'' +
        ", primaryPhoneType=" + primaryPhoneType +
        ", homePhone=" + homePhone +
        ", workPhone=" + workPhone +
        ", cellPhone=" + cellPhone +
        ", faxPhone=" + faxPhone +
        ", primaryEmail='" + primaryEmail + '\'' +
        ", secondaryEmail='" + secondaryEmail + '\'' +
        ", country=" + country +
        ", attention='" + attention + '\'' +
        ", address1='" + address1 + '\'' +
        ", address2='" + address2 + '\'' +
        ", address3='" + address3 + '\'' +
        ", city='" + city + '\'' +
        ", postalCode='" + postalCode + '\'' +
        ", addressValidUntil=" + addressValidUntil +
        ", addressType=" + addressType +
        ", addressLocationType=" + addressLocationType +
        '}'
  }
}