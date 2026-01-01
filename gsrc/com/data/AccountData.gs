package com.data

uses typekey.AccountContactRole

class AccountData {
  private var accountNumber: String as AccountNumber
  private var firstName: String as FirstName
  private var lastname: String as LastName
  private var addressLine1: String as AddressLine1
  private var addressLine2: String as AddressLine2
  private var state: State as State
  private var postalcode: String as PostalCode
  private var country: Country as Country
  private var attention_ACC: String as Attention_ACC
  private var locationNum: int as LocationNum
  private var currency: Currency as Currency
  private var addressType: AddressType as AddressType
  private var accountOrgType: AccountOrgType as AccountOrgType
  private var accountContactRole: AccountContactRole as AccountContactRole
}