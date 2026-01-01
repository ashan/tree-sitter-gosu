package nz.co.acc.query.builder

uses gw.api.database.ISelectQueryBuilder
uses gw.contact.ContactQueryBuilder
uses gw.contact.OfficialIDQueryBuilder

/**
 * ContactQueryBuilder is a class that builds queries for Contact and its subtypes.
 *
 * Created by andy on 12/12/2016.
 */
class ContactQueryBuilder_ACC extends ContactQueryBuilder {

  var _primaryACCNumber_ACC : String
  var _aepContractNumber_ACC : String
  var _dateOfBirth : Date

  function withPrimaryAccNumber_ACC(value : String) : ContactQueryBuilder_ACC {
    _primaryACCNumber_ACC = value
    return this
  }
  function withAEPContractNumber_ACC(value : String) : ContactQueryBuilder_ACC {
    _aepContractNumber_ACC = value
    return this
  }
  
  function withDateOfBirth(value : Date) : ContactQueryBuilder_ACC {
    _dateOfBirth = value
    return this
  }

  @Override
  function doRestrictQuery(selectQueryBuilder : ISelectQueryBuilder) {
    super.doRestrictQuery(selectQueryBuilder)
    if (_primaryACCNumber_ACC.NotBlank) {
      selectQueryBuilder.compare(Company#PrimaryACCNumber_ACC, Equals, _primaryACCNumber_ACC)
    }
    if (_aepContractNumber_ACC.NotBlank) {
      selectQueryBuilder.compare(Account#AEPContractNumber_ACC, Equals, _aepContractNumber_ACC)
    }
  }
}