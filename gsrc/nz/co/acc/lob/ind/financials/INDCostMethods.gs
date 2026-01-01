package nz.co.acc.lob.ind.financials

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
structure INDCostMethods {

  property get Coverage(): Coverage

  property get OwningCoverable(): Coverable

  property get Jurisdiction(): Jurisdiction
}