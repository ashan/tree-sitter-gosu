package nz.co.acc.entity.company

uses gw.api.util.phone.GWPhoneNumberBuilder
uses gw.api.util.PhoneUtil
uses gw.api.util.phone.GWPhoneNumber

enhancement GWCompanyEnhancement : entity.Company {

  property get CellPhoneValue() : String {
    return PhoneUtil.format(this.CellPhoneCountry_ACC, this.CellPhone_ACC, this.CellPhoneExtension_ACC)
  }

  property get CellPhoneValueIntl() : String {
    return PhoneUtil.formatIntl(this.CellPhoneCountry_ACC, this.CellPhone_ACC, this.CellPhoneExtension_ACC)
  }

  property get GWCellPhone() : GWPhoneNumber {
    return PhoneUtil.buildPhoneNumbers(this.CellPhoneCountry_ACC, this.CellPhone_ACC, this.CellPhoneExtension_ACC)
  }

  property set GWCellPhone(phone : GWPhoneNumber){
    this.CellPhoneCountry_ACC = phone.CountryCode
    this.CellPhone_ACC = phone.NationalNumber
    this.CellPhoneExtension_ACC = phone.Extension
  }



}
