package gw.web.payment.demo

uses gw.api.json.JsonObject
uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses gw.api.web.embedded.EmbeddedWidgetUpdateHandler
uses gw.payment.paymentgateway.impl.TokenizedCreditCardDetails

/**
 * Handler class used for updating the user-view/PCF with response data
 * from embedded widget's client side remote API call to external server.
 */
@Export
class PaymentIntegrationUpdateHandler implements EmbeddedWidgetUpdateHandler {

  var _jobNumber : String
  var _cardInfo : TokenizedCreditCardDetails

  construct(jobNumber : String, cardInfo : TokenizedCreditCardDetails){
    _jobNumber = jobNumber
    _cardInfo = cardInfo
  }

  /**
   * Recieve JSON from the credit card collection ui-integration with the embedded widget.
   *
   * In this reference implementation, we are accepting a JSON payload from in a standardized format the format described below:
   *
   * This payload includes a credit card token that can be used later on in invoking a payment.
   *
   * Note, the token is not actually used in this piece of reference code, but instead we rely on
   * {@link gw.billing.PolicyPeriodBillingEnhancement#createPaymentInstrument}
   * to create a payment instrument and the assocaited token that can be used later.
   *
   *
   * <ul>
   *   <li>parse the provided Json into a credit card</li>
   *   <li>extract a token which can be used for payment</li>
   *   <li>extract the last 4 digits of the credit card to help identify it</li>
   *   <li>reference code for how the token might be persisted</li>
   *   <li>this code, does not provide a reference for how to charge the credit card using the provided token</li>
   *  </ul>
   *
   *  It is recommended that the payload has the following format, and any conversion between a vendor specific format
   *  is done in the card collection html to ensure future interoperability:
   *
   * <pre>

   {
     "type": "CARD_TOKENIZED",
     "tokenizedCard": {  //includes a required json object 'tokenizedCard'
       "cardType": "visa",
       "expDate": "2022-11",
       "lastFour": "1111",
       "opaqueData": "mj578gsskllkjj0000test",  //the token required
       "opaqueDataDescriptor": ""
       },
     "debug": { //optional debug field
       // details that may help the debug what went wrong
     }
   }
   * </pre>
   * @return the input json
   */
  override function update(cardData : JsonObject) : JsonObject {

    var paymentMethodObject = cardData.getObject("tokenizedCard")
    var token : String = paymentMethodObject.get("opaqueData") as String
    var cardName = ""
    if (paymentMethodObject.containsKey("lastFour")){
      cardName = "xxxx xxxx xxxx " + paymentMethodObject.get("lastFour")
    } else {
      cardName = "card added: " + Date.Today
    }
    _cardInfo.Token = token
    _cardInfo.CardName = cardName


    var job = Job.finder.findJobByJobNumber(_jobNumber)
    var currentUser: User = User.util.CurrentUser
    if (not currentUser.canView(job)) {
      throw new DisplayableException(DisplayKey.get("Java.Error.Permission.View", "job"))
    }

    /*
     * Note, the token is not actually used in this piece of reference code, but instead we rely on
     * {@link gw.billing.PolicyPeriodBillingEnhancement#createPaymentInstrument}
     * to create a payment instrument and the assocaited token that can be used later.
     */
    //job.LatestPeriod.createPaymentInstrument(AccountPaymentMethod.TC_CREDITCARD, job.Policy.Account.AccountNumber, token)
    return cardData
  }
}