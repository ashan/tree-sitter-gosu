package nz.co.acc.query.builder

uses gw.account.AccountSummaryQueryBuilder
uses gw.api.database.ISelectQueryBuilder
uses gw.pl.persistence.core.Key

/**
 * AccountSummaryQueryBuilder is a concrete class that builds queries for AccountSummary
 * (i.e. a lightweight view entity typically used in in search result lists).
 *
 * @see AccountQueryBuilderBase
 * @see AccountSummaryQueryBuilder
 *
 * Created by andy on 12/12/2016.
 */
class AccountSummaryQueryBuilder_ACC extends AccountSummaryQueryBuilder {

  var _accId_ACC: String
  var _irdNumber_ACC: String
  var _nzbn_ACC: String
  var _irNZBN_ACC : String
  var _tradingName_ACC: String
  var _primeACCNumber_ACC: String
  var _aepContractNumber_ACC : String
  var _relationshipManager_ACC: User
  var _aepComplianceAdvisor_ACC : User
  var _attention_ACC : String
  var _statusOfAccount_ACC : StatusOfAccount_ACC
  var _activeReason_ACC : ActiveReason_ACC
  var _phone : String
  var _email : String
  var _contactType : ContactType
  var _accountid_ACC : Long


  function withAccountHolderContact(value : ContactQueryBuilder_ACC) : AccountSummaryQueryBuilder_ACC {
    return super.withAccountHolderContact(value) as AccountSummaryQueryBuilder_ACC
  }

  override protected property get SelectQueryBuilderType() : Type {
    return Account
  }

  function withIrdNumber_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _irdNumber_ACC = value
    return this
  }
  function withPrimaryACCNumber_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _primeACCNumber_ACC = value
    return this
  }
  function withNzbn_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _nzbn_ACC = value
    return this
  }

  function withTradingName_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _tradingName_ACC = value
    return this
  }
  function withRelationshipManager_ACC(value : User) : AccountSummaryQueryBuilder_ACC {
    _relationshipManager_ACC = value
    return this
  }
  function withAEPComplianceAdvisor(value : User) : AccountSummaryQueryBuilder_ACC {
    _aepComplianceAdvisor_ACC = value
    return this
  }
  function withACCId_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _accId_ACC = value
    return this
  }
  function withAEPContractNumber_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _aepContractNumber_ACC = value
    return this
  }
  function withAttention_ACC(value : String) : AccountSummaryQueryBuilder_ACC {
    _attention_ACC = value
    return this
  }
  function withStatusOfAccount_ACC(value : StatusOfAccount_ACC) : AccountSummaryQueryBuilder_ACC {
    _statusOfAccount_ACC = value
    return this
  }
  function withActiveReason_ACC(value : ActiveReason_ACC) : AccountSummaryQueryBuilder_ACC {
    _activeReason_ACC = value
    return this
  }
  function withHomePhone(value : String) : AccountSummaryQueryBuilder_ACC {
    _phone = value
    return this
  }

  function withEmail(value : String) : AccountSummaryQueryBuilder_ACC {
    _email = value
    return this
  }
  function withContactType(value : ContactType) : AccountSummaryQueryBuilder_ACC {
    _contactType = value
    return this
  }
  function withID_ACC(value : Long) : AccountSummaryQueryBuilder_ACC {
    _accountid_ACC = value
    return this
  }


  @Override
  function doRestrictQuery(selectQueryBuilder : ISelectQueryBuilder) {
    super.doRestrictQuery(selectQueryBuilder)
    if (_accId_ACC.NotBlank) {
      selectQueryBuilder.compare(Account#ACCID_ACC, Equals, _accId_ACC)
    }
    if (_nzbn_ACC.NotBlank) {
      selectQueryBuilder.compare(Account#NZBN_ACC, Equals, _nzbn_ACC)
    }
    if (_irdNumber_ACC.NotBlank) {
      // DE2243 - search for 8 digit IRD numbers (i.e. the leading 0 removed) too using OR statement.
      var _8digitIRD = _irdNumber_ACC.substring(1)
      selectQueryBuilder.or(\orIRD -> {
        orIRD.compare(Account#IRDNumber_ACC, Equals, _irdNumber_ACC)
        orIRD.compare(Account#IRDNumber_ACC, Equals, _8digitIRD)
      })
    }
    if (_tradingName_ACC.NotBlank) {
      selectQueryBuilder.compare(Account#TradingName_ACC, Equals, _tradingName_ACC)
    }
    if (_relationshipManager_ACC != null) {
      selectQueryBuilder.compare(Account#RelationshipManager_ACC, Equals, _relationshipManager_ACC)
    }
    if (_aepComplianceAdvisor_ACC != null) {
      selectQueryBuilder.compare(Account#AEPComplianceAdvisor_ACC, Equals, _aepComplianceAdvisor_ACC)
    }
    if (_primeACCNumber_ACC.NotBlank) {
      selectQueryBuilder.join(Account#AccountHolderContact).cast(Company).compare(Company#PrimaryACCNumber_ACC, Equals, _primeACCNumber_ACC)
    }
    if (_aepContractNumber_ACC.NotBlank) {
      selectQueryBuilder.compare(Account#AEPContractNumber_ACC, Equals, _aepContractNumber_ACC)
    }
    if (_attention_ACC.NotBlank) {
      selectQueryBuilder.join(Account#AccountHolderContact).cast(Contact).join(Contact#PrimaryAddress).cast(Address).compare(Address#Attention_ACC, Equals, _attention_ACC)
    }
    if (_phone.NotBlank) {
      if (_contactType == ContactType.TC_COMPANY) {
        selectQueryBuilder.join(Account#AccountHolderContact).cast(Company).or(\orPhone -> {
          orPhone.compare(Company#HomePhone, Equals, _phone)
          orPhone.compare(Company#WorkPhone, Equals, _phone)
          orPhone.compare(Company#IRCellPhone_ACC, Equals, _phone)
          orPhone.compare(Company#CellPhone_ACC, Equals, _phone)
        })
      } else if (_contactType == ContactType.TC_PERSON) {
        selectQueryBuilder.join(Account#AccountHolderContact).cast(Person).or(\orPhone -> {
          orPhone.compare(Person#HomePhone, Equals, _phone)
          orPhone.compare(Person#WorkPhone, Equals, _phone)
          orPhone.compare(Person#IRCellPhone_ACC, Equals, _phone)
          orPhone.compare(Person#CellPhone, Equals, _phone)
        })
      }
    }
    if (_email.NotBlank) {
      selectQueryBuilder.join(Account#AccountHolderContact).or(\orEmail -> {
        orEmail.compare(Contact#EmailAddress1, Equals, _email)
        orEmail.compare(Contact#EmailAddress2, Equals, _email)
        orEmail.compare(Contact#IREmailAddress, Equals, _email)
      })
    }
    if (_statusOfAccount_ACC != null) {
      selectQueryBuilder.compare(Account#StatusOfAccount_ACC, Equals, _statusOfAccount_ACC)
    }
    if (_activeReason_ACC != null) {
      selectQueryBuilder.compare(Account#ActiveReason_ACC, Equals, _activeReason_ACC)
    }
    if (_accountid_ACC != null){
      selectQueryBuilder.compare(Account#ID, Equals, new Key(Account, _accountid_ACC))
    }
  }
}
