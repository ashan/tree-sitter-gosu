package nz.co.acc.integration.junoinformationservice.model.policy

class GSONBICCode {
  public var cuCode : String
  public var cuDescription : String
  public var bicCode : String
  public var bicCodeDescription : String

  public construct(entity : PolicyLineBusinessClassificationUnit_ACC) {
    cuCode = entity.CUCode
    cuDescription = entity.CUDescription
    bicCode = entity.BICCode
    bicCodeDescription = entity.BICDescription
  }
}