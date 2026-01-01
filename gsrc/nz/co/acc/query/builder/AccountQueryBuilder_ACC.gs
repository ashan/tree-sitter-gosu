package nz.co.acc.query.builder

uses gw.account.AccountQueryBuilder
uses gw.api.database.ISelectQueryBuilder

/**
 * Created by GallagB on 19/12/2016.
 */
class AccountQueryBuilder_ACC extends AccountQueryBuilder {

  var _accId_ACC: String
  var _irdNumber_ACC: String
  var _nzbn_ACC: String
  var _tradingName_ACC: String
  var _primeACCNumber_ACC: String
  var _relationshipManager_ACC: User
  var _aepContractNumber_ACC: String


  function withIrdNumber_ACC(value : String) : AccountQueryBuilder_ACC {
    _irdNumber_ACC = value
    return this
  }
  function withPrimaryACCNumber_ACC(value : String) : AccountQueryBuilder_ACC {
    _primeACCNumber_ACC = value
    return this
  }
  function withNzbn_ACC(value : String) : AccountQueryBuilder_ACC {
    _nzbn_ACC = value
    return this
  }
  function withTradingName_ACC(value : String) : AccountQueryBuilder_ACC {
    _tradingName_ACC = value
    return this
  }
  function withRelationshipManager_ACC(value : User) : AccountQueryBuilder_ACC {
    _relationshipManager_ACC = value
    return this
  }
  function withACCId_ACC(value : String) : AccountQueryBuilder_ACC {
    _accId_ACC = value
    return this
  }
  function withAEPContractNumber_ACC(value : String) : AccountQueryBuilder_ACC {
    _aepContractNumber_ACC = value
    return this
  }

  @Override
  function doRestrictQuery(selectQueryBuilder : ISelectQueryBuilder){
    super.doRestrictQuery(selectQueryBuilder)
    if (_accId_ACC.NotBlank ) {
      selectQueryBuilder.compare(Account#ACCID_ACC, Equals, _accId_ACC)
    }
    if (_nzbn_ACC.NotBlank ) {
      selectQueryBuilder.compare(Account#NZBN_ACC, Equals, _nzbn_ACC)
    }
    if (_irdNumber_ACC.NotBlank ) {
      selectQueryBuilder.compare(Account#IRDNumber_ACC, Equals, _irdNumber_ACC)
    }
    if (_tradingName_ACC.NotBlank ) {
      selectQueryBuilder.compare(Account#TradingName_ACC, Equals, _tradingName_ACC)
    }
    if (_relationshipManager_ACC != null) {
      selectQueryBuilder.compare(Account#RelationshipManager_ACC, Equals, _relationshipManager_ACC)
    }
    if (_primeACCNumber_ACC.NotBlank ) {
      selectQueryBuilder.join(Account#AccountHolderContact).cast(Company).compare(Company#PrimaryACCNumber_ACC, Equals, _primeACCNumber_ACC)
    }
    if (_aepContractNumber_ACC.NotBlank ) {
      selectQueryBuilder.compare(Account#AEPContractNumber_ACC, Equals, _aepContractNumber_ACC)
    }
  }

}