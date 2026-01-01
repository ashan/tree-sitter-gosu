package gw.lob.util_acc

uses java.math.BigDecimal

/**
 * Created by eliyaz on 13/03/2017.
 */
class DiscountsUtil_ACC {
  private static final var wsdDiscount : int = (ScriptParameters.getParameterValue("WSDDiscount_ACC") as BigDecimal).intValue()
  private static final var wsmpPrimaryDiscount : int = (ScriptParameters.getParameterValue("WSMPPrimaryDiscount_ACC") as BigDecimal).intValue()
  private static final var wsmpSecondaryDiscount : int = (ScriptParameters.getParameterValue("WSMPSecondaryDiscount_ACC") as BigDecimal).intValue()
  private static final var wsmpTertiaryDiscount : int = (ScriptParameters.getParameterValue("WSMPTertiaryDiscount_ACC") as BigDecimal).intValue()


  public static function getPercentage(wsdOrWsmp : String) : int {
    switch(wsdOrWsmp){
      case DiscountsApplied_ACC.TC_WSD.Code : return wsdDiscount
      case DiscountsApplied_ACC.TC_WSMPPRIMARY.Code : return wsmpPrimaryDiscount
      case DiscountsApplied_ACC.TC_WSMPSECONDARY.Code : return wsmpSecondaryDiscount
      case DiscountsApplied_ACC.TC_WSMPTERTIARY.Code : return wsmpTertiaryDiscount
    }
    return 0
  }
}