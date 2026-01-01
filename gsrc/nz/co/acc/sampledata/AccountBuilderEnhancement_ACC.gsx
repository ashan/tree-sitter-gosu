package nz.co.acc.sampledata

uses gw.api.builder.AccountBuilder
uses gw.api.database.Query
uses gw.api.database.Relop

/**
 * Created by Ian Rainford on 7/12/2016.
 */
enhancement AccountBuilderEnhancement_ACC: AccountBuilder {

  public function withIRDNumber(IRDNumber: String): AccountBuilder {
    this.set(Account.IRDNUMBER_ACC_PROP.get(), IRDNumber)
    return this
  }

  public function withACCId(accId: String): AccountBuilder {
    this.set(Account.ACCID_ACC_PROP.get(), accId)
    return this
  }

  public function withBalanceDate(balanceDate: Date): AccountBuilder {
    this.set(Account.BALANCEDATE_ACC_PROP.get(), balanceDate)
    return this
  }

  public function withEntityType(entiyType: String): AccountBuilder {
    this.set(Account.ENTITYTYPE_ACC_PROP.get(), entiyType)
    return this
  }

  public function withIrdSortKey(irdSortKey: String): AccountBuilder {
    this.set(Account.IRDNUMBER_ACC_PROP.get(), irdSortKey)
    return this
  }

  public function withNZBN(nzbn: String): AccountBuilder {
    this.set(Account.NZBN_ACC_PROP.get(), nzbn)
    return this
  }

  public function withTaxTypeEndDate(taxTypeEndDate: Date): AccountBuilder {
    this.set(Account.TAXTYPEENDDATE_ACC_PROP.get(), taxTypeEndDate)
    return this
  }

  public function withRelationshipManager(relationshipManager: String): AccountBuilder {
    this.set(Account.RELATIONSHIPMANAGER_ACC_PROP.get(), relationshipManager)
    return this
  }

  public function withSource(source: Source_ACC): AccountBuilder {
    this.set(Account.SOURCE_ACC_PROP.get(), source)
    return this
  }

  public function withStatusOfAccount(statusOfAccount: StatusOfAccount_ACC): AccountBuilder {
    this.set(Account.STATUSOFACCOUNT_ACC_PROP.get(), statusOfAccount)
    return this
  }

  public function withTradingName(tradingName: String): AccountBuilder {
    this.set(Account.TRADINGNAME_ACC_PROP.get(), tradingName)
    return this
  }

  public function withMigrationStatus(migrated: boolean): AccountBuilder {
    this.set(Account.MIGRATED_ACC_PROP.get(), migrated)
    return this
  }

  public function withRelationshipManager(user: User): AccountBuilder {
    this.set(Account.RELATIONSHIPMANAGER_ACC_PROP.get(), user)
    return this
  }

  public function asAEPAccount(): AccountBuilder {
    this.set(Account.AEPCONTRACTACCOUNT_ACC_PROP.get(), true);
    return this;
  }

  public function withAEPContractNumber(contractNumber: String): AccountBuilder {
    this.set(Account.AEPCONTRACTNUMBER_ACC_PROP.get(), contractNumber);
    return this;
  }

  public function withAEPAgreementOrigSignedDate(date: Date): AccountBuilder {
    this.set(Account.AEPAGREEMENTORIGSIGNEDDATE_ACC_PROP.get(), date);
    return this;
  }

  function withDefaultACCProducerCode(): AccountBuilder {
    var accProducerCode = Query.make(ProducerCode)
        .compare(ProducerCode#Description, Relop.Equals, "Accident Compensation Corporation")
        .select()
        .FirstResult
    return this.withProducerCode(accProducerCode)
  }

}