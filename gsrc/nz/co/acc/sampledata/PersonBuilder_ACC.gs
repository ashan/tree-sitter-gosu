package nz.co.acc.sampledata

uses gw.api.builder.PersonBuilder

/**
 * Created by Ian Rainford on 11/01/2017.
 */
class PersonBuilder_ACC extends PersonBuilder {
  public function withMigratedStatus(status : boolean) : PersonBuilder_ACC {
    this.set(Person.MIGRATED_ACC_PROP.get(), status);
    return this;
  }

  public function withAccountNumber(value : String) : PersonBuilder_ACC {
    this.set(Person.ACCID_ACC_PROP.get(), value)
    return this
  }

  public function withDummyContact(value : boolean) : PersonBuilder_ACC {
    this.set(Person.DUMMYCONTACT_ACC_PROP.get(), value)
    return this
  }
}