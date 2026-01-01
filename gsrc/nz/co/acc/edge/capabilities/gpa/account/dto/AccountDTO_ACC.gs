package nz.co.acc.edge.capabilities.gpa.account.dto

uses edge.capabilities.gpa.account.dto.AccountDTO
uses edge.jsonmapper.JsonProperty
uses nz.co.acc.edge.capabilities.accountcontact.dto.AccountContactDTO_ACC

/**
 * Created by nitesh.gautam on 1/03/2017.
 */
class AccountDTO_ACC extends AccountDTO {
  @JsonProperty
  var _NZBNACC : String as Nzbn

  @JsonProperty
  var _IRDNumberACC : String as IrdNumber

  @JsonProperty
  var _accNumberACC : String as AccNumber

  @JsonProperty
  var _accountHolder : AccountContactDTO_ACC as ACCAccountHolder

  @JsonProperty
  var _hasIssuedPolicy: boolean as HasIssuedPolicy

  @JsonProperty
  var _correspondence : CorrespondencePreference_ACC as Correspondence

  @JsonProperty
  var _isAEPAccount : Boolean as IsAEPAccount

  @JsonProperty
  var _balanceDate : Date as BalanceDate
}