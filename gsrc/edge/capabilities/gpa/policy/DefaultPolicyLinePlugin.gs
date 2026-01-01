package edge.capabilities.gpa.policy

uses edge.capabilities.gpa.policy.dto.PolicyLineDTO
uses edge.di.annotations.ForAllGwNodes
uses entity.EMPWPCLine

class DefaultPolicyLinePlugin implements IPolicyLinePlugin {

  @ForAllGwNodes
  construct(){}

  override function toDTO(aPolicyLine: PolicyLine): PolicyLineDTO {
    if(aPolicyLine == null){
      return null
    }
    final var dto = new PolicyLineDTO()
    dto.LineOfBusinessCode = aPolicyLine.PatternCode
    dto.LineOfBusinessName = aPolicyLine.getDisplayName()
    if(aPolicyLine typeis EMPWPCLine) {
      var liableEarnings = aPolicyLine.EMPWPCCovs.first().LiableEarningCov
      dto.ERAIndicator = liableEarnings?.ERAIndicator_ACC
      dto.ERAChangedDate = liableEarnings?.ERAChangedDate_ACC
      dto.ERAContractNumber = liableEarnings?.ERAContractNumber_ACC
    }


    return dto
  }

  override function getPolicyLines(aPolicyPeriod: PolicyPeriod): PolicyLineDTO[] {
    var policyLineDTOs: PolicyLineDTO[]
    if (aPolicyPeriod.Lines.HasElements){
      policyLineDTOs = new PolicyLineDTO[aPolicyPeriod.Lines.Count];

      aPolicyPeriod.Lines.orderBy(\line -> line.ID).eachWithIndex(\line, i -> {
        policyLineDTOs[i] = this.toDTO(line)
      })
    }

    return policyLineDTOs
  }
}
