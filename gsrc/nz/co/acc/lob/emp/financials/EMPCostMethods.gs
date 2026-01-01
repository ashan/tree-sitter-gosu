package nz.co.acc.lob.emp.financials

/**
 * Additional methods and properties provided by the costs that supply this interface.
 */
@Export
structure EMPCostMethods {

  property get Coverage(): Coverage

  property get OwningCoverable(): Coverable

  property get Jurisdiction(): Jurisdiction
}