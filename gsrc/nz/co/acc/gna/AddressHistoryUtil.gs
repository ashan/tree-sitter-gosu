package nz.co.acc.gna

uses gw.api.database.Query
uses gw.api.database.QuerySelectColumns
uses gw.api.database.Relop
uses gw.api.path.Paths

/**
 * Created by Mike Ourednik on 11/11/2020.
 */
class AddressHistoryUtil {

  function getHistoricalProductAddress(contact : Contact, productCode : String, documentDate : Date) : Address{
    var result : Optional<Address>
    if (productCode == "IndividualACC" || productCode == "IndividualCPX") {
      result = getAddressHistory(contact, documentDate).map(\addrHistory -> addrHistory.CPCPXAddress)
      if(result.Empty){
        return contact.CPCPXAddress_ACC
      }
    } else if (productCode == "EmployerACC") {
      result = getAddressHistory(contact, documentDate).map(\addrHistory -> addrHistory.WPCAddress)
      if(result.Empty){
        return contact.WPCAddress_ACC
      }
    } else if (productCode == "ShareholdingCompany") {
      result = getAddressHistory(contact, documentDate).map(\addrHistory -> addrHistory.WPSAddress)
      if(result.Empty){
        return contact.WPSAddress_ACC
      }
    } else if (productCode == "AccreditedEmployersProgramme") {
      result = getAddressHistory(contact, documentDate).map(\addrHistory -> addrHistory.PrimaryAddress)
      if(result.Empty){
        return contact.PrimaryAddress
      }
    }
    return result.get()
  }

  function getHistoricalPrimaryAddress(contact : Contact, documentDate : Date) : Address {
    var result = getAddressHistory(contact, documentDate).map(\addrHistory -> addrHistory.PrimaryAddress)
    if(result.Empty){
      return contact.PrimaryAddress
    }
    return result.get()
  }

  function getAddressHistory(contact : Contact, timestamp : Date) : Optional<AddressHistory_ACC> {
    var result = Query.make(AddressHistory_ACC)
        .compare(AddressHistory_ACC#Contact, Relop.Equals, contact.ID)
        .compare(AddressHistory_ACC#UpdateTime, Relop.LessThan, timestamp)
        .select()
        .orderByDescending(QuerySelectColumns.path(Paths.make(AddressHistory_ACC#UpdateTime)))
        .first()
    return Optional.ofNullable(result)
  }
}