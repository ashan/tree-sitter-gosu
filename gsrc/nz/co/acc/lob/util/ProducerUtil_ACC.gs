package nz.co.acc.lob.util

uses com.guidewire.pc.system.internal.InternalMethods
uses com.guidewire.pc.web.controller.PCWebSession
uses com.guidewire.pl.system.dependency.PLDependencies
uses gw.api.database.Query

/**
 * Created by ManubaF on 28/11/2016.
 */
class ProducerUtil_ACC {

  public static final var DEFAULT_PRODUCER_CODE_ACC : String = "Standard Code"
  public static final var DEFAULT_ORGANIZATION_ACC : String = "Accident Compensation Corporation"

  static function queryProducerCodes_ACC() : ProducerCode{
    var queryProdObj = Query.make(entity.ProducerCode)
    queryProdObj.compare("Code", Equals, DEFAULT_PRODUCER_CODE_ACC)
    return queryProdObj.select().first()
  }

  static function queryOrganization_ACC() : Organization {
    var queryOrgObj = Query.make(entity.Organization)
    queryOrgObj.compare("Name", Equals, DEFAULT_ORGANIZATION_ACC)
    return queryOrgObj.select().first()
  }

  static function queryUnderwritingCompany_ACC() : UWCompany {
    var query = Query.make(UWCompany)
    query.compare(UWCompany#Name, Equals, DEFAULT_ORGANIZATION_ACC)
    query.compare(UWCompany#State, Equals, Jurisdiction.TC_NZ)
    var result = query.select().first()
    return result
  }

  static function setDefaultOrganizationandProducer_ACC() : ProducerSelection {
    var selectionProducer = gw.web.account.AccountCreateUtil.getOrCreateProducerSelectionForCreateAccount()

    var producer = queryOrganization_ACC()
    if (producer != null) {
      selectionProducer.setProducer(producer)
    }

    var code = queryProducerCodes_ACC()
    if (code != null) {
      selectionProducer.setProducerCode(code)
    }

    return selectionProducer
  }
}