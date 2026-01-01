package gw.web.payment.demo

uses gw.api.json.JsonObject
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.embedded.EmbeddedWidgetActionHandler

/**
 * Handler for Error events from embedded credit card iframe.
 */
@Export
class PaymentIntegrationActionHandler implements EmbeddedWidgetActionHandler {

  /**
   * Handle errors sent from the user interface and display them as a DisplayableExcpetion.  We expect the following
   * format for error messages.  Conversion into this format should be done in html/javascript prior to calling back
   * into this method.  If we cannot properly parse the error message, a generic message stating that there was an error
   * with the PaymentGateway.
   * <pre>
   * {
   * ​  "type": "ERROR",
   * ​  "apiError": { // details of the failed API request (if any)
   *      "title": "unauthorized-data-access",
   * ​     "status": 403,
   *      "detail": "Not authorized to access requested data. Verify proper permissions have been granted for access."
   * ​  },
   *   "debug": {
   * ​    // details that may help the Midas (c offeepot) team debug what went wrong
   *   }
   * ​}
   * ​</pre>
   */
  override function action(error : JsonObject) {
    if (error == null) {
      throw new DisplayableException(DisplayKey.get("Web.PaymentInstrument.CollectCreditCardPopup.Error"))
    }
    var detail : String = null
    try {
      detail = error.getObject("apiError").getString("detail")
    } catch (e) {
      //can't parse the error, just throw a generic server error
      throw new DisplayableException(DisplayKey.get("Web.PaymentInstrument.CollectCreditCardPopup.Error"))
    }
    throw new DisplayableException(DisplayKey.get("Web.PaymentInstrument.CollectCreditCardPopup.SaveCreditCard.UserError", detail))
  }
}