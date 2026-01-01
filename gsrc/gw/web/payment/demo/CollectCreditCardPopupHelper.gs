package gw.web.payment.demo
uses gw.api.json.JsonObject
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses org.json.JSONObject

/**
 * Helper class for UpFrontPaymentPopup UI
 */
@Export
class CollectCreditCardPopupHelper {

  private static var PAYMENT_GATEWAY_KEY : String

  construct() {
    PAYMENT_GATEWAY_KEY = System.getenv("PAYMENT_GATEWAY_KEY")
  }

  function originOf(url : String) : String {
    var urlOrigin = url.replaceFirst("^(https?:\\/\\/[^\\/]*)(\\/.*)?", "$1")
    return urlOrigin
  }

  /**
   * Returns a Json, consisting of config values to be passed-in for the Embedded iframe application
   */
  function getPaymentContextProvider(jobNumber : String) : JsonObject {
    var context = new JsonObject()
    context.put('paymentGatewayKey', PAYMENT_GATEWAY_KEY)
    context.put('jobNumber', jobNumber)
    return context
  }
}