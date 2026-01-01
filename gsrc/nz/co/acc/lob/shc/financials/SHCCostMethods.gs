package nz.co.acc.lob.shc.financials

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
structure SHCCostMethods {

  property get Coverage(): Coverage

  property get OwningCoverable(): Coverable

  property get Jurisdiction(): Jurisdiction
}