package nz.co.acc.integration.junoinformationservice.model.account

class GSONAccountContact {
  public var active : Boolean
  public var contact : GSONContact
  public var primary : Boolean
  public var accountContactRoles : List<GSONAccountContactRole>
}