package nz.co.acc.plm.integration.bulkupload.csvtypes.contact

/**
 * Data object for a parsed Company contact CSV row
 *
 * Created by OurednM on 14/06/2018.
 */
class CompanyContact extends IContactCommonFields {

  var name: String as Name

  override function toString(): String {
    return "CompanyContact{" +
        "name='" + name + '\'' +
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