package nz.co.acc.lob.aep.financials

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
structure AEPCostMethods {

  property get Coverage(): Coverage

  property get OwningCoverable(): Coverable

  property get Jurisdiction(): Jurisdiction
}