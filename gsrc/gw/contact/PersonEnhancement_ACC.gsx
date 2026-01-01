package gw.contact

uses gw.api.locale.DisplayKey
uses gw.api.util.DisplayableException
uses org.apache.commons.lang3.time.DateUtils
/**
 * Person enhancements for ACC.
 */
enhancement PersonEnhancement_ACC: entity.Person {

  /**
   * Checks the date of birth field to make sure its in the required range
   *
   * @return boolean true = is within the range or DOB is null
   *
   */
  property get DateOfBirthInValidRange_ACC() : boolean {
    if (this.DateOfBirth != null) {
      var today = DateUtils.truncate(Date.Now, java.util.Calendar.DAY_OF_MONTH)
      return this.DateOfBirth.before(today)
    } else { return true } // valid if null for non mandatory fields
  }

  /*
  * Checks the Accreditations if they are empty
  *
  * @throws DisplayableException message 'Accreditation fields are empty'
   */
  public function checkEmptyAccreditations_ACC(accreditations : Accreditation_ACC[]){
    accreditations.each(\elt -> {
      if (!(elt.AccreditationNumber_ACC != null or elt.AccreditationType_ACC != null
          or elt.CompanyName_ACC != null)) {
        throw new DisplayableException(DisplayKey.get("Web.AccountContactsLV.AccreditationFieldsEmpty_ACC"))
      }
    })
  }
}
