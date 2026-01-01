package nz.co.acc.query.builder

uses gw.address.AddressQueryBuilder
uses gw.api.database.ISelectQueryBuilder

/**
 * AddressQueryBuilder_ACC is a class that builds queries for Address and its subtypes.
 */
class AddressQueryBuilder_ACC extends AddressQueryBuilder {
  var _attention_ACC : String


  function withAttention_ACC(value : String) : AddressQueryBuilder_ACC {
    _attention_ACC = value
    return this
  }

  @Override
  function doRestrictQuery(selectQueryBuilder : ISelectQueryBuilder) {
    super.doRestrictQuery(selectQueryBuilder)
    if (_attention_ACC.NotBlank) {
      selectQueryBuilder.startsWith(Address#Attention_ACC, _attention_ACC, true)
    }
  }

}