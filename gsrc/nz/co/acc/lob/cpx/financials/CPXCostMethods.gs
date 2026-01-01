package nz.co.acc.lob.cpx.financials

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
structure CPXCostMethods {

  property get Coverage(): Coverage

  property get OwningCoverable(): Coverable

  property get Jurisdiction(): Jurisdiction
}