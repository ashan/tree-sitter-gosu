package nz.co.acc.edge.capabilities.policy.dto

uses edge.capabilities.policy.dto.PolicyPeriodDTO
uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC
uses nz.co.acc.lob.cpx.INDCPXCovUtil_ACC

uses java.math.BigDecimal

/**
 * Created by lee.teoh on 22/06/2017.
 */
enhancement PolicyPeriodDTO_ACCEnhancement: PolicyPeriodDTO_ACC {
  static function fromPolicyPeriodDTO(policyPeriodDto : PolicyPeriodDTO) : PolicyPeriodDTO_ACC{
    var newPolicyPeriodDTOACC = new PolicyPeriodDTO_ACC()
    newPolicyPeriodDTOACC.DocumentDTOs = policyPeriodDto.DocumentDTOs
    newPolicyPeriodDTOACC.CanUploadDocument = policyPeriodDto.CanUploadDocument
    newPolicyPeriodDTOACC.Effective = policyPeriodDto.Effective
    newPolicyPeriodDTOACC.Expiration = policyPeriodDto.Expiration
    newPolicyPeriodDTOACC.idCardPublicID = policyPeriodDto.idCardPublicID
    newPolicyPeriodDTOACC.idCardSessionID = policyPeriodDto.idCardSessionID
    newPolicyPeriodDTOACC.Lobs = policyPeriodDto.Lobs
    var minMax = INDCPXCovUtil_ACC.findMinMaxCPXValues(policyPeriodDto.Effective)
    if(policyPeriodDto.Lobs.cp != null) {
      newPolicyPeriodDTOACC.CPXMinimumCoverPermitted = minMax.First
      newPolicyPeriodDTOACC.CPXMaximumCoverPermitted = minMax.Second
    }
    return newPolicyPeriodDTOACC
  }
}
