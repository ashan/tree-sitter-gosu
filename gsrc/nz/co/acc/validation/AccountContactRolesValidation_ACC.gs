package nz.co.acc.validation

uses entity.AccountContact
uses gw.api.locale.DisplayKey
uses gw.validation.PCValidationBase
uses gw.validation.PCValidationContext
uses nz.co.acc.lob.common.DateUtil_ACC

/**
 * Created by Ian Rainford on 15/12/2016.
 */
class AccountContactRolesValidation_ACC extends PCValidationBase {

  var _accountContact: AccountContact[]

  construct(valContext: PCValidationContext, accountContact: AccountContact[]) {
    super(valContext)
    _accountContact = accountContact
  }

  static function validateRoleData(accountContact: AccountContact[]) {
    PCValidationContext.doPageLevelValidation(\context -> new AccountContactRolesValidation_ACC(context, accountContact).validate())
  }

  static function validateRoleData(accountContact: AccountContact) {
    PCValidationContext.doPageLevelValidation(\context -> new AccountContactRolesValidation_ACC(context, {accountContact}).validate())
  }

  protected override function validateImpl() {
    Context.addToVisited(this, "validateImpl")
    missingInformationForContactRole()
    dateOfBirthInValidRange()
  }

  function missingInformationForContactRole(){
    Context.addToVisited(this, "missingInformationForContactRole")

    for (accContact in _accountContact) {
      for (role in accContact.Roles) {
        if (role typeis AuthorisedCompanyEmployee_ACC) {
          if ((role as AuthorisedCompanyEmployee_ACC).EmployeeRelation == null) {
            Result.addError(accContact, ValidationLevel.TC_LOADSAVE, DisplayKey.get("AccountAPI.Error.Invalid.AccountContactRole.Data_ACC", accContact.DisplayName, role))
          }
        }
        if (role typeis Authorised3rdParty_ACC) {
          if ((role as Authorised3rdParty_ACC).PartyRelation == null) {
            Result.addError(accContact, ValidationLevel.TC_LOADSAVE, DisplayKey.get("AccountAPI.Error.Invalid.AccountContactRole.Data_ACC", accContact.DisplayName, role))
          }
        }
      }
    }
  }

  function dateOfBirthInValidRange(){
    Context.addToVisited(this, "dateOfBirthInValidRange")

    for (accContact in _accountContact) {
      if (accContact.Contact typeis Person and !accContact.Contact.Migrated_ACC) {
        var dateOfBirth = accContact.Contact.DateOfBirth
        // DE415 - Allow null DOB to pass validation
        if(dateOfBirth != null and !dateOfBirth?.afterOrEqual(DateUtil_ACC.createDate(1, 1, 1900))) {
          Result.addError(accContact, ValidationLevel.TC_LOADSAVE, DisplayKey.get("AccountAPI.Error.Invalid.AccountContactRole.DOBMinDate_ACC", accContact.DisplayName))
        }
      }
    }
  }
}
