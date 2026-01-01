package nz.co.acc.plm.integration.webservice.policy.util

uses nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.anonymous.elements.PolicyPeriod_AEPLine_AEPInvoiceCosts_Entry
uses nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.anonymous.elements.PolicyPeriod_CWPSLine_SHCCosts_Entry
uses nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.anonymous.elements.PolicyPeriod_EMPWPCLine_EMPCosts_Entry
uses nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.anonymous.elements.PolicyPeriod_INDCPXLine_CPXCosts_Entry
uses nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.anonymous.elements.PolicyPeriod_INDCoPLine_INDCosts_Entry

/**
 * Helper class to extract GST costs from Policy Period GX Model
 * <p>
 * Created by Mike Ourednik on 17/10/2019.
 */
class PolicyPeriodGxModelUtil {
  var _policyPeriodGxModel : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod

  construct(policyPeriodGxModel : nz.co.acc.plm.integration.webservice.gxmodel.policyperiodmodel.PolicyPeriod) {
    this._policyPeriodGxModel = policyPeriodGxModel
  }

  function getWpsNonDeductibleGstEntry() : PolicyPeriod_CWPSLine_SHCCosts_Entry {
    if (_policyPeriodGxModel.CWPSLine.SHCCosts?.Entry?.HasElements) {
      return _policyPeriodGxModel.CWPSLine.SHCCosts.Entry
          .firstWhere(\entry -> entry.ChargePattern.Code == ChargePattern.TC_GST.Code
              and entry.Subtype.DisplayName == "Non-tax deductible GST")
    } else {
      return null
    }
  }

  function getWpsDeductibleGstEntry() : PolicyPeriod_CWPSLine_SHCCosts_Entry {
    if (_policyPeriodGxModel.CWPSLine.SHCCosts?.Entry?.HasElements) {
      return _policyPeriodGxModel.CWPSLine.SHCCosts.Entry
          .firstWhere(\entry -> entry.ChargePattern.Code == ChargePattern.TC_GST.Code
              and entry.Subtype.DisplayName == "Tax deductible GST")
    } else {
      return null
    }
  }

  function getWpcGstEntry() : PolicyPeriod_EMPWPCLine_EMPCosts_Entry {
    if (_policyPeriodGxModel.EMPWPCLine.EMPCosts?.Entry?.HasElements) {
      return _policyPeriodGxModel.EMPWPCLine.EMPCosts.Entry
          .firstWhere(\entry -> entry.ChargePattern.Code == ChargePattern.TC_GST.Code)
    } else {
      return null
    }
  }

  function getCpGstEntry() : PolicyPeriod_INDCoPLine_INDCosts_Entry {
    if (_policyPeriodGxModel.INDCoPLine.INDCosts?.Entry?.HasElements) {
      return _policyPeriodGxModel.INDCoPLine.INDCosts.Entry
          .firstWhere(\entry -> entry.ChargePattern.Code == ChargePattern.TC_GST.Code)
    } else {
      return null
    }
  }

  function getCpxGstEntry() : PolicyPeriod_INDCPXLine_CPXCosts_Entry {
    if (_policyPeriodGxModel.INDCPXLine.CPXCosts?.Entry?.HasElements) {
      return _policyPeriodGxModel.INDCPXLine.CPXCosts.Entry
          .firstWhere(\entry -> entry.ChargePattern.Code == ChargePattern.TC_GST.Code)
    } else {
      return null
    }
  }

  function getAepGstEntry() : PolicyPeriod_AEPLine_AEPInvoiceCosts_Entry {
    if(_policyPeriodGxModel.AEPLine.AEPInvoiceCosts?.Entry?.HasElements) {
      return _policyPeriodGxModel.AEPLine.AEPInvoiceCosts.Entry
          .firstWhere(\elt -> elt.ChargePattern.Code == ChargePattern.TC_GST.Code)
    } else {
      return null
    }
  }

}