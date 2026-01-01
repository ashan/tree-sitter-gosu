package nz.co.acc.integration.ir.record

uses org.apache.commons.lang3.builder.EqualsBuilder
uses org.apache.commons.lang3.builder.HashCodeBuilder

/**
 * Customer Information
 * <p>
 * Created by Mike Ourednik on 14/07/2019.
 */
public class CREGRecord extends AbstractIRRecord {

  var business_name: String as EmployerName
  var business_irdRefNumber: String as IrdReferenceNumber
  var control_recordType: Integer as RecordType

  var business_tradeName : String as TradeName
  var business_phoneNumber : String as BusinessPhone
  var business_cellPhoneNumber : String as CellPhone
  var business_taxTypeStartDate : Date as TaxTypeStartDate
  var business_taxTypeEndDate : Date as TaxTypeEndDate
  var business_taxTypeEndReason : String as TaxTypeEndReason
  var business_entityClass : String as EntityClass
  var business_entityType : String as EntityType
  var business_employerClassification : String as EmployerClassification
  var business_natureOfBusiness : String as NatureOfBusiness
  var business_nzbn : String as NZBN
  var business_email : String as Email

  var individual_firstNames : String as FirstNames
  var individual_lastName : String as LastName
  var individual_title : String as Title
  var individual_phoneNumber : String as HomePhone
  var individual_dateOfBirth : Date as DateOfBirth

  var physicalAddress_addressLine1 : String as PhysicalAddressLine1
  var physicalAddress_addressLine2 : String as PhysicalAddressLine2
  var physicalAddress_postCode : String as PhysicalAddressPostalcode
  var physicalAddress_changeDate : Date as PhysicalAddressChangeDate
  var physicalAddress_statusIndicatorFlag : String as PhysicalAddressStatusIndicator

  var postalAddress_addressLine1 : String as PostalAddressLine1
  var postalAddress_addressLine2 : String as PostalAddressLine2
  var postalAddress_postCode : String as PostalAddressPostalcode
  var postalAddress_changeDate : Date as PostalAddressChangeDate
  var postalAddress_statusIndicatorFlag : String as PostalAddressStatusIndicator

  var control_agentCode : String as AgentCode
  var control_irdSortKey : String as IrdSortKey
  var control_changeType : String as ChangeType
  var parent_accNumber : String as ParentACCNumber

  override function toString() : String {
    return "CREGRecord(inboundPublicID=${this.InboundRecordPublicID}, accID=${this.AccNumber})"
  }

  override function equals(o : Object) : boolean {
    if (this === o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    var that = o as CREGRecord;

    return new EqualsBuilder()
        .append(business_tradeName, that.business_tradeName)
        .append(business_phoneNumber, that.business_phoneNumber)
        .append(business_cellPhoneNumber, that.business_cellPhoneNumber)
        .append(business_taxTypeStartDate, that.business_taxTypeStartDate)
        .append(business_taxTypeEndDate, that.business_taxTypeEndDate)
        .append(business_taxTypeEndReason, that.business_taxTypeEndReason)
        .append(business_entityClass, that.business_entityClass)
        .append(business_entityType, that.business_entityType)
        .append(business_employerClassification, that.business_employerClassification)
        .append(business_natureOfBusiness, that.business_natureOfBusiness)
        .append(business_nzbn, that.business_nzbn)
        .append(business_email, that.business_email)
        .append(individual_firstNames, that.individual_firstNames)
        .append(individual_lastName, that.individual_lastName)
        .append(individual_title, that.individual_title)
        .append(individual_phoneNumber, that.individual_phoneNumber)
        .append(individual_dateOfBirth, that.individual_dateOfBirth)
        .append(physicalAddress_addressLine1, that.physicalAddress_addressLine1)
        .append(physicalAddress_addressLine2, that.physicalAddress_addressLine2)
        .append(physicalAddress_postCode, that.physicalAddress_postCode)
        .append(physicalAddress_changeDate, that.physicalAddress_changeDate)
        .append(physicalAddress_statusIndicatorFlag, that.physicalAddress_statusIndicatorFlag)
        .append(postalAddress_addressLine1, that.postalAddress_addressLine1)
        .append(postalAddress_addressLine2, that.postalAddress_addressLine2)
        .append(postalAddress_postCode, that.postalAddress_postCode)
        .append(postalAddress_changeDate, that.postalAddress_changeDate)
        .append(postalAddress_statusIndicatorFlag, that.postalAddress_statusIndicatorFlag)
        .append(control_agentCode, that.control_agentCode)
        .append(control_irdSortKey, that.control_irdSortKey)
        .append(control_changeType, that.control_changeType)
        .append(parent_accNumber, that.parent_accNumber)
            // Common fields
        .append(InboundRecordPublicID, that.InboundRecordPublicID)
        .append(AccNumber, that.AccNumber)
        .append(EmployerName, that.EmployerName)
        .append(IrdReferenceNumber, that.IrdReferenceNumber)
        .append(RecordType, that.RecordType)
        .isEquals();
  }

  override function hashCode() : int {
    return new HashCodeBuilder(17, 37)
        .append(business_tradeName)
        .append(business_phoneNumber)
        .append(business_cellPhoneNumber)
        .append(business_taxTypeStartDate)
        .append(business_taxTypeEndDate)
        .append(business_taxTypeEndReason)
        .append(business_entityClass)
        .append(business_entityType)
        .append(business_employerClassification)
        .append(business_natureOfBusiness)
        .append(business_nzbn)
        .append(business_email)
        .append(individual_firstNames)
        .append(individual_lastName)
        .append(individual_title)
        .append(individual_phoneNumber)
        .append(individual_dateOfBirth)
        .append(physicalAddress_addressLine1)
        .append(physicalAddress_addressLine2)
        .append(physicalAddress_postCode)
        .append(physicalAddress_changeDate)
        .append(physicalAddress_statusIndicatorFlag)
        .append(postalAddress_addressLine1)
        .append(postalAddress_addressLine2)
        .append(postalAddress_postCode)
        .append(postalAddress_changeDate)
        .append(postalAddress_statusIndicatorFlag)
        .append(control_agentCode)
        .append(control_irdSortKey)
        .append(control_changeType)
        .append(parent_accNumber)
            // Common fields
        .append(InboundRecordPublicID)
        .append(AccNumber)
        .append(EmployerName)
        .append(IrdReferenceNumber)
        .append(RecordType)
        .toHashCode();
  }
}