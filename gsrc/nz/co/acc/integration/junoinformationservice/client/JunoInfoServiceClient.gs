package nz.co.acc.integration.junoinformationservice.client

uses com.google.gson.GsonBuilder
uses nz.co.acc.common.integration.jis.CosmosDBConstants
uses nz.co.acc.common.integration.jis.JunoInfoServiceAPI

uses nz.co.acc.integration.junoinformationservice.payloadgenerator.account.AccountGsonGenerator
uses nz.co.acc.integration.junoinformationservice.payloadgenerator.document.DocumentGsonGenerator
uses nz.co.acc.integration.junoinformationservice.payloadgenerator.policy.PolicyTermGsonGenerator
uses gw.surepath.suite.integration.logging.StructuredLogger

/**
 * High level client for writing updates to Info Access system.
 * <p>
 * Created by Mike Ourednik on 20/09/2019.
 */
class JunoInfoServiceClient {

  var _gson = new GsonBuilder().serializeNulls().create()
  static var _log = StructuredLogger.INTEGRATION.withClass(JunoInfoServiceClient)

  public static final var INSTANCE : JunoInfoServiceClient = new JunoInfoServiceClient()

  public function update(account : Account, notificationsEnabled : Boolean) {
    var gsonModel = new AccountGsonGenerator().generate(account)
    var payload = _gson.toJson(gsonModel)
    JunoInfoServiceAPI.INSTANCE.upsert(
        payload, gsonModel.id, gsonModel.accId, CosmosDBConstants.ACCOUNTS_COLLECTION, notificationsEnabled)
  }

  function update(period : PolicyPeriod, notificationsEnabled : Boolean) {
    var gsonModel = new PolicyTermGsonGenerator().generate(period)
    var payload = _gson.toJson(gsonModel)
    JunoInfoServiceAPI.INSTANCE.upsert(
        payload, gsonModel.id, gsonModel.accId, CosmosDBConstants.POLICYTERMS_COLLECTION, notificationsEnabled)
  }

  function update(document : Document, notificationsEnabled : Boolean) {
    var gsonModel = new DocumentGsonGenerator().generate(document)
    var payload = _gson.toJson(gsonModel)
    JunoInfoServiceAPI.INSTANCE.upsert(
        payload, gsonModel.id, gsonModel.accId, CosmosDBConstants.DOCUMENTS_COLLECTION, notificationsEnabled)
  }

  function delete(document : Document) {
    JunoInfoServiceAPI.INSTANCE.delete(document.DocUID, document.Account.ACCID_ACC, CosmosDBConstants.DOCUMENTS_COLLECTION)
  }

}