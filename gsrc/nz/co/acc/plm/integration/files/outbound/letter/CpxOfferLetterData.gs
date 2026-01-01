package nz.co.acc.plm.integration.files.outbound.letter

uses nz.co.acc.common.integration.files.outbound.BaseData

uses java.math.BigDecimal

/**
 * POJO class which represents the variable data of the CPX letters.
 * It is used by all the four CPX letter cases: Offer, Lapsed, Renewal, Cancellation
 */
class CpxOfferLetterData extends BaseData {

  // Header information
  var _accountFullName: String as AccountFullName
  var _accountStatus: String as AccountStatus
  var _hasValidAddress: boolean as HasValidAddress
  var _attn: String as Attn
  var _addressLine1: String as AddressLine1
  var _addressLine2: String as AddressLine2
  var _addressLine3: String as AddressLine3
  var _city: String as City
  var _postCode: String as PostCode
  var _country: String as Country
  var _addressValidUntil: Date as AddressValidUntil
  var _primaryEmail: String as PrimaryEmail
  var _mobile: String as Mobile
  var _accAccountNumber: String as AccAccountNumber
  var _productName: String as ProductName
  var _policyLine: String as PolicyLine

  // Offer information
  var _cuCode: String as CUCode
  var _cuDescription: String as CUDescription
  var _agreedLevelOfCover: BigDecimal as AgreedLevelOfCover
  var _policyStartDate: Date as PolicyStartDate
  var _policyEndDate: Date as PolicyEndDate
  var _coverTypeStandard: Boolean as CoverTypeStandard
  var _grossLevy: BigDecimal as GrossLevy
  var _cancellationReason : String as CancellationReason
  var _minimumCPXCover : BigDecimal as MinimumCPXCover
  var _cancellationDate : String as CancellationDate

  // Chris A 22/11/2019 NTK-8575 Add Delivery preference to outbound letter
  var _correspondencePreference : String as CorrespondencePreference_ACC
  // Chris A 22/09/2020 JUNO-6676 adding NZBN to template
  var _nzbn : String as NZBN

  construct() {
    _hasValidAddress = false
  }

}


