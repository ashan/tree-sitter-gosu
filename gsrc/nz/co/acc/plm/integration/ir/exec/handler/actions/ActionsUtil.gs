package nz.co.acc.plm.integration.ir.exec.handler.actions

uses entity.Contact
uses entity.Job
uses gw.api.database.IQueryBeanResult
uses gw.api.database.Query
uses gw.api.database.Relop
uses nz.co.acc.lob.common.DateUtil_ACC
uses org.joda.time.DateTime
uses org.joda.time.LocalDate
uses org.joda.time.Years

/**
 * Utils for actions classes.
 * <p>
 * Created by Swati Patel on 01/02/2017.
 */
class ActionsUtil {


  /**
   * Get account for ACC Number
   *
   * @param accNumber - ACC Number to lookup
   * @return the Account or null if not found
   * <p>
   * Created by Swati Patel on 01/02/17
   */
  public static function getAccountByAccNumber(accNumber : String) : Account {
    var query = Query.make(Account).compare(Account#ACCID_ACC, Relop.Equals, accNumber)
    // TODO this may need to change
    return query.select().AtMostOneRow
  }

  /**
   * Should only be called when only one match is expected
   *
   * @param accNumber - to lookup
   * @return
   */
  public static function getContactByAccNumber(accNumber : String) : Contact {
    var query = Query.make(Contact).compare(Contact#ACCID_ACC, Relop.Equals, accNumber)
    return query.select().AtMostOneRow
  }

  public static function getCompanyByAccNumber(accNumber : String) : Company {
    var query = Query.make(Company).compare(Contact#ACCID_ACC, Relop.Equals, accNumber)
    return query.select().AtMostOneRow
  }

  public static function getPersonByAccNumber(accNumber : String) : Person {
    var query = Query.make(Person).compare(Contact#ACCID_ACC, Relop.Equals, accNumber)
    return query.select().AtMostOneRow
  }

  /**
   * When multiple results could be found.
   *
   * @param accNumber - to lookup
   * @return
   */
  public static function getContactByAccNumberMultiple(accNumber : String) : IQueryBeanResult<Contact> {
    var query = Query.make(Contact).compare(Contact#ACCID_ACC, Relop.Equals, accNumber)
    return query.select()
  }

  public static function getACCProducerCode() : ProducerCode {
    return Query.make(ProducerCode)
        .compare(ProducerCode#Description, Relop.Equals, "Accident Compensation Corporation")
        .select()
        .AtMostOneRow
  }

  /**
   * Check if line type exists on the policy.
   *
   * @param lineType - the line type to search for
   * @param policy   - the policy to search
   * @return
   */
  public static function lineTypeExistsOnPolicy(lineType : typekey.PolicyLine, policy : Policy) : boolean {
    var period = Policy.finder.findMostRecentBoundPeriodByPolicy(policy)
    // Period has a property for each line for whether it exists
    return period[lineType + "Exists"] as boolean
  }

  public static function setIRFlags(job : Job) {
    job.TriggerReason_ACC = ReasonCode.TC_IR_ACC
    job.Recyclable_ACC = false
    job.InternalJob_ACC = true
  }

  public static function calculatePolicyStartDate() : Date {
    return DateUtil_ACC.previousACCLevyYearStart(Date.CurrentDate).addYears(ScriptParameters.IRPeriodStartOffset_ACC).addMinutes(1)
  }

  public static function setFMUStatus(dob : Date, cov : INDLiableEarnings_ACC, year : int) {
    if (dob == null) {
      return
    }
    var minAge = ScriptParameters.getParameterValue("IRFMUMinAge_ACC") as int
    var maxAge = ScriptParameters.getParameterValue("IRFMUMaxAge_ACC") as int
    var birthdate = new DateTime(dob)

    // We get their age as at 1st April of the year passed in
    var day = ScriptParameters.getParameterValue("ACCLevyYearStartDay") as int
    var month = ScriptParameters.getParameterValue("ACCLevyYearStartMonth") as int
    var date = new LocalDate(year, month, day)

    var age = Years.yearsBetween(birthdate, date.toDateTimeAtStartOfDay()).Years
    if (age < minAge || age >= maxAge) {
      cov.FullTime = false
    } else {
      cov.FullTime = true
    }
  }

}
