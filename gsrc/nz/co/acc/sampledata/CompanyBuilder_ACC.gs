package nz.co.acc.sampledata

uses gw.api.builder.CompanyBuilder
uses entity.Company;

/**
 * Created by Ian Rainford on 7/12/2016.
 */
class CompanyBuilder_ACC extends CompanyBuilder {

  public function withPrimaryACCNumber(primAccNumber : String) : CompanyBuilder_ACC {
    this.set(Company.PRIMARYACCNUMBER_ACC_PROP.get(), primAccNumber);
    return this;
  }

  public function withMigratedStatus(status : boolean) : CompanyBuilder_ACC {
    this.set(Company.MIGRATED_ACC_PROP.get(), status);
    return this;
  }

  public function withAccountNumber(value : String) : CompanyBuilder_ACC {
    this.set(Company.ACCID_ACC_PROP.get(), value);
    return this;
  }

  public function withDummyContact_ACC(value : boolean) : CompanyBuilder_ACC {
    set(Company#DummyContact_ACC, value)
    return this
  }

}