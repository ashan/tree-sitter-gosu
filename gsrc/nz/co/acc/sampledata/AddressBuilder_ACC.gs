package nz.co.acc.sampledata

uses gw.api.builder.AddressBuilder

/**
 * Created by Ian Rainford on 8/12/2016.
 */
class AddressBuilder_ACC extends AddressBuilder {
  public function withAttention(attention : String) : AddressBuilder_ACC {
    this.set(Address.ATTENTION_ACC_PROP.get(), attention)
    return this
  }

  public function withMigratedStatus(status : boolean) : AddressBuilder_ACC {
    this.set(Address.MIGRATED_ACC_PROP.get(), status)
    return this
  }

  public function withAddressLocationType(type: typekey.AddressLocationType_ACC) : AddressBuilder_ACC {
    this.set(Address.ADDRESSLOCTYPE_ACC_PROP.get(), type)
    return this
  }

  public function withAddressPolicyType(type : AddressPolicyType_ACC) : AddressBuilder_ACC {
    this.set(Address.ADDRESSPOLICYTYPE_ACC_PROP.get(), type)
    return this
  }

  public function withUpdateTime_ACC(date: Date): AddressBuilder_ACC {
    this.set(Address.UPDATETIME_ACC_PROP.get(), date)
    return this
  }

}