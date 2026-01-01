package nz.co.acc.constants

/**
 * Created by Mike Ourednik on 4/22/21.
 */
enum ProductCode {
  AccreditedEmployersProgramme,
  EmployerACC,
  IndividualACC,
  ShareholdingCompany

  property get Suffix() : ProductSuffix {
    switch (this) {
      case AccreditedEmployersProgramme:
        return ProductSuffix.E
      case EmployerACC:
        return ProductSuffix.E
      case IndividualACC:
        return ProductSuffix.S
      case ShareholdingCompany:
        return ProductSuffix.D
      default:
        return null
    }
  }

}
