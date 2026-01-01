package nz.co.acc.lob.aep

uses java.sql.ResultSet

/**
 * AEP Contact report row data.
 */
class AEPContactReportRowData {
  var _aepContractNumber_ACC : String as AEPContractNumber_ACC
  var _accountName : String as AccountName
  var _relationshipManager : String as RelationshipManager
  var _complianceAdvisor : String as ComplianceAdvisor
  var _contactType : String as ContactType
  var _contactRole : String as ContactRole
  var _customerName : String as CustomerName
  var _aepTPAAgreement : String as AEPTPAAgreement
  var _aepTPANature : String as AEPTPANature
  var _workPhone : String as WorkPhone
  var _homePhone : String as HomePhone
  var _cellPhone : String as CellPhone
  var _emailAddress1 : String as EmailAddress1
  var _emailAddress2 : String as EmailAddress2
  var _primaryAttentionTo : String as PrimaryAttentionTo
  var _primaryAddressLine1 : String as PrimaryAddressLine1
  var _primaryAddressLine2 : String as PrimaryAddressLine2
  var _primaryAddressLine3 : String as PrimaryAddressLine3
  var _primaryCity : String as PrimaryCity
  var _primaryPostalCode : String as PrimaryPostalCode
  var _primaryCountry : String as PrimaryCountry
  var _preferredPhysical : String as PreferredPhysical
  var _preferredPostal : String as PreferredPostal
  var _claimsPhysical : String as ClaimsPhysical
  var _claimsPostal : String as ClaimsPostal

  construct(resultSet : ResultSet) {
    _aepContractNumber_ACC = resultSet.getString("AEPContractNumber_ACC")
    _accountName = resultSet.getString("AccountName")
    _relationshipManager = resultSet.getString("RelationshipManager")
    _complianceAdvisor = resultSet.getString("ComplianceAdvisor")
    _contactType = resultSet.getString("ContactType")
    _contactRole = resultSet.getString("ContactRole")
    _customerName = resultSet.getString("CustomerName")
    _aepTPAAgreement = resultSet.getString("AEPTPAAgreement")
    _aepTPANature = resultSet.getString("AEPTPANature")
    _workPhone = resultSet.getString("WorkPhone")
    _homePhone = resultSet.getString("HomePhone")
    _cellPhone = resultSet.getString("CellPhone")
    _emailAddress1 = resultSet.getString("EmailAddress1")
    _emailAddress2 = resultSet.getString("EmailAddress2")
    _primaryAttentionTo = resultSet.getString("PrimaryAttentionTo")
    _primaryAddressLine1 = resultSet.getString("PrimaryAddressLine1")
    _primaryAddressLine2 = resultSet.getString("PrimaryAddressLine2")
    _primaryAddressLine3 = resultSet.getString("PrimaryAddressLine3")
    _primaryCity = resultSet.getString("PrimaryCity")
    _primaryPostalCode = resultSet.getString("PrimaryPostalCode")
    _primaryCountry = resultSet.getString("PrimaryCountry")
    _preferredPhysical = resultSet.getString("Preferred Physical")
    _preferredPostal = resultSet.getString("Preferred Postal")
    _claimsPhysical = resultSet.getString("Claims Physical")
    _claimsPostal = resultSet.getString("Claims Postal")
  }
}