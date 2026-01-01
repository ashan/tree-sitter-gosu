package nz.co.acc.integration.junoinformationservice.model.policy

uses java.math.BigDecimal

class GSONCPXCoverage {
  public var publicId : String
  public var requestedLevelOfCover : BigDecimal
  public var agreedLevelOfCover : BigDecimal
  public var periodStart : String
  public var periodEnd : String
  public var applicationReceived : String
  public var coverType : String
  public var maxCoverPermitted : BigDecimal
}