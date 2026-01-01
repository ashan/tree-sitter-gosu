package nz.co.acc.edge.capabilities.policy.dto

uses nz.co.acc.edge.capabilities.policy.lob.dto.PolicyLineBaseDTO_ACC

/**
 * Created by manubaf on 11/11/2020.
 */
enhancement PolicyPeriodUpdateDTO_ACCEnhancement : PolicyPeriodUpdateDTO_ACC {
  property get CoverPlus() : PolicyLineBaseDTO_ACC {
    return this.Lobs.firstWhere(\elt -> elt.LineOfBusiness.equalsIgnoreCase("CoverPlus"))
  }

  property get CoverPlusExtra() : PolicyLineBaseDTO_ACC {
    return this?.Lobs?.firstWhere(\elt -> elt.LineOfBusiness.equalsIgnoreCase("CoverPlus Extra"))
  }

  property get Employer() : PolicyLineBaseDTO_ACC {
    return this?.Lobs?.firstWhere(\elt -> elt.LineOfBusiness.equalsIgnoreCase("WorkPlace Cover"))
  }

  property get ShareholdingCompany() : PolicyLineBaseDTO_ACC {
    return this?.Lobs?.firstWhere(\elt -> elt.LineOfBusiness.equalsIgnoreCase("WorkPlace Cover for Shareholders"))
  }
}
