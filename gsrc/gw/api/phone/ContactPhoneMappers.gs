package gw.api.phone

uses java.util.Map
uses java.util.List
uses gw.api.util.phone.EntityPhoneMapper
uses gw.entity.IEntityType

/**
 * Utility for adding phone mappers for Contact and subtypes.
 */
@Export
class ContactPhoneMappers {

    /**
     * Adds phone mappers for Contact and subtypes.
     */
    static function addContactPhoneMappers(mappers:Map<IEntityType, List<EntityPhoneMapper>>) {
         var contactPhoneMapper = new EntityPhoneMapper(Contact)
              .withPhoneColumns("FaxPhoneCountry", "FaxPhone", "FaxPhoneExtension")
              .withPhoneColumns("HomePhoneCountry", "HomePhone", "HomePhoneExtension")
              .withPhoneColumns("WorkPhoneCountry", "WorkPhone", "WorkPhoneExtension")
         var personPhoneMapper = new EntityPhoneMapper(Person)
              .withPhoneColumns("CellPhoneCountry", "CellPhone", "CellPhoneExtension")
// DE149 Geoff Infield 2017-04-20 add company cell
         var companyPhoneMapper = new EntityPhoneMapper(Company)
             .withPhoneColumns("CellPhoneCountry_ACC", "CellPhone_ACC", "CellPhoneExtension_ACC")

         mappers[Contact] = java.util.Collections.unmodifiableList({contactPhoneMapper, personPhoneMapper, companyPhoneMapper})
    }
}
