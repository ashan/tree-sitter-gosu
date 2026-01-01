package nz.co.acc.plm.integration.webservice.policy.util

uses java.math.BigDecimal

/**
 * Helper class to extract GST costs from Policy Period
 * <p>
 * Created by Mike Ourednik on 17/10/2019.
 */
class PolicyPeriodUtil {

  var _policyPeriod : PolicyPeriod

  construct(policyPeriod : PolicyPeriod) {
    _policyPeriod = policyPeriod
  }

  function getAepGst() : BigDecimal {
    if (not _policyPeriod.AEPLineExists) {
      return 0.00bd
    } else return _policyPeriod.AEPLine.AEPInvoiceCosts
        .firstWhere(\cost -> cost.ChargePattern == ChargePattern.TC_GST)
        ?.ActualAmountBilling?.Amount?:0.00bd
  }

  function getWpcGst() : BigDecimal {
    if (not _policyPeriod.EMPWPCLineExists) {
      return 0.00bd
    } else return _policyPeriod.EMPWPCLine.EMPCosts
        .firstWhere(\cost -> cost.ChargePattern == ChargePattern.TC_GST)
        ?.ActualAmountBilling?.Amount?:0.00bd
  }

  function getWpsDeductibleGst() : BigDecimal {
    if (not _policyPeriod.CWPSLineExists) {
      return 0.00bd
    } else return _policyPeriod.CWPSLine.SHCCosts
        .firstWhere(\cost -> cost.ChargePattern == ChargePattern.TC_GST
            and cost.Subtype.DisplayName == "Tax deductible GST"
        )?.ActualAmountBilling?.Amount?:0.00bd
  }

  function getWpsNonDeductibleGst() : BigDecimal {
    if (not _policyPeriod.CWPSLineExists) {
      return 0.00bd
    } else return _policyPeriod.CWPSLine.SHCCosts
        .firstWhere(\cost -> cost.ChargePattern == ChargePattern.TC_GST
            and cost.Subtype.DisplayName == "Non-tax deductible GST"
        )?.ActualAmountBilling?.Amount?:0.00bd
  }


  function getCpCpxGst() : BigDecimal {
    if (not _policyPeriod.CPLineExists) {
      return 0.00bd
    } else {
      var gstAmountCharged = _policyPeriod.INDCoPLine.INDCosts
          .firstWhere(\cost -> cost.ChargePattern == ChargePattern.TC_GST)
          ?.ActualAmountBilling?.Amount?:0.00bd

      if (_policyPeriod.INDCPXLineExists) {
        gstAmountCharged += _policyPeriod.INDCPXLine.CPXCosts
            .firstWhere(\cost -> cost.ChargePattern == ChargePattern.TC_GST)
            ?.ActualAmountBilling?.Amount?:0.00bd
      }
      return gstAmountCharged
    }
  }
}