package nz.co.acc.gwer.bulkupload.row

uses java.math.BigDecimal

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERPaymentTypeCodesRow extends AbstractXLSRow {
  public var paymentCode : String as PaymentCode = null
  public var paymentDescription : String as PaymentDescription = null
  public var levyPaymentGroup : String as LevyPaymentGroup = null

  @Override
  function toString() : String  {
  return "ERPaymentTypeCodesRow{" +
      "paymentCode='" + paymentCode + '\'' +
      ", paymentDescription='" + paymentDescription + '\'' +
      ", levyPaymentGroup='" + levyPaymentGroup + '\'' +
      '}';
  }
}