package nz.co.acc.account

uses com.guidewire.pc.web.controller.SessionItem
uses entity.Activity
uses entity.Contact
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.locale.DisplayKey
uses gw.pl.persistence.core.Bundle
uses nz.co.acc.plm.integration.apimgmt.events.CustomEvents
uses org.apache.commons.lang.StringUtils

/**
 * ACC utility class for Account related operations
 * Created by AliF on 18/11/2016.
 */

class AccountUtil {
  /**
   * Converts an IRD number to an ACC number.
   *
   * @param irdNumber
   * @return the ACC number, or null for invalid IRD numbers
   */

  public static function IRDNumberToACCNumber(irdNumber : String) : String {
    if (irdNumber == null) {
      return null
    }
    var stripped = irdNumber.replaceAll("-", "").replaceAll(" ", "").replaceAll("\t", "")
    if (stripped.length() < 8 or stripped.length() > 9) {
      return null
    }
    var c11 = StringUtils.leftPad(stripped, 9, "0")
    var n : int
    try {
      n = Integer.parseInt(c11)
    } catch (e : NumberFormatException) {
      return null
    }
    var d11 = StringUtils.leftPad(Integer.toString((n / 10 + 12345) % 1000000), 6, "0")
    var e11 = d11.substring(4) + d11.substring(2, 4) + d11.substring(0, 2)
    var f11 = c11.substring(1, 2) + e11
    var g11 = c11.substring(0, 1) + f11
    var h11 = Integer.parseInt(g11) % 23 + 1
    var i11 = "ABCDEFGHJKLMNPQRSTUVWXY".charAt(h11 - 1)
    var j11 = f11.charAt(Integer.parseInt(c11.substring(0, 1)) / 2)
    var k11 = (Integer.parseInt(c11.substring(0, 1)) % 2 == 0 ? "BCDFGHJKLM" : "NPQRSTVWXZ").charAt(j11 - 48)
    var x = Integer.parseInt(c11.substring(0, 1)) / 2
    var l11 = c11.charAt(0) != '0' ? i11 + f11.substring(0, x) + k11 + f11.substring(x + 1, 7) : i11 + f11
    return l11
  }

  /**
   * This method will return true if the acc number exists for the AccountHolder ContactType (Person or Company)
   */
  public static function accountExistsWithACCNumber(ACCNumber : String, contactType : typekey.Contact) : boolean {
    if (contactType == null) {
      throw new IllegalArgumentException("Contact Type cannot be null")
    }
    if (contactType != typekey.Contact.TC_PERSON and contactType != typekey.Contact.TC_COMPANY) {
      throw new IllegalArgumentException("Contact Type must be a Person or a Company")
    }
    var accountQuery = Query.make(Account).compare(Account#ACCID_ACC, Equals, ACCNumber)
    var accountQueryresult = accountQuery.select()

    if (accountQueryresult.HasElements) {
      if (contactType == typekey.Contact.TC_PERSON and accountQueryresult.toList().hasMatch(\ac -> ac.AccountHolderContact typeis Person)) {
        return true
      }
      if (contactType == typekey.Contact.TC_COMPANY and accountQueryresult.toList().hasMatch(\ac -> ac.AccountHolderContact typeis Company)) {
        return true
      }
    }
    return false
  }

  /**
   * create IR processKey
   * @param accid, bundle
   * @return
   */
  public static function createIRProccessorKey(accid : String, bundle : Bundle) {
    var exists = Query.make(IRProcessorKey_ACC)
        .compare(IRProcessorKey_ACC#ACCID, Relop.Equals, accid).select().getCountLimitedBy(1) > 0
    if (not exists) {
      var irProcessorKey_acc = bundle.add(new IRProcessorKey_ACC())
      irProcessorKey_acc.ACCID = accid
    }
  }

  /**
   * Returns account with specified ACC ID
   *
   * @param ACCNumber
   * @return
   */
  public static function getAccount(ACCNumber : String) : Account {
    return Query.make(Account).compare(Account#ACCID_ACC, Equals, ACCNumber).select().first()
  }


  /**
   * This method will return true if the IRD number exists for the AccountHolder ContactType (Person or Company)
   */
  public static function accountExistsWithIRDNumber(irdNumber : String, contactType : typekey.Contact) : boolean {
    if (contactType == null) {
      throw new IllegalArgumentException("Contact Type cannot be null")
    }
    if (contactType != typekey.Contact.TC_PERSON and contactType != typekey.Contact.TC_COMPANY) {
      throw new IllegalArgumentException("Contact Type must be a Person or a Company")
    }
    var accountQuery = Query.make(Account).compare(Account#IRDNumber_ACC, Equals, irdNumber)
    var accountQueryresult = accountQuery.select()

    if (accountQueryresult.HasElements) {
      return true
    }
    return false
  }


  public static function getAccountActivityPattern_ACC() : ActivityPattern {
    var pattern = ActivityPattern.finder.getActivityPatternByCode("general_reminder")
    pattern.setCategory(ActivityCategory.TC_REMINDER)
    pattern.setType(ActivityType.TC_GENERAL)
    pattern.setMandatory(true)
    pattern.setPriority(Priority.TC_URGENT)
    pattern.setTargetDays(5)
    pattern.setTargetIncludeDays(IncludeDaysType.TC_BUSINESSDAYS)
    pattern.setTargetStartPoint(StartPointType.TC_ACTIVITYCREATION)
    pattern.setEscalationDays(7)
    pattern.setEscalationInclDays(IncludeDaysType.TC_BUSINESSDAYS)
    pattern.setEscalationStartPt(StartPointType.TC_ACTIVITYCREATION)
    pattern.setPatternLevel(ActivityPatternLevel.TC_ACCOUNT)
    pattern.setActivityClass(ActivityClass.TC_TASK)
    pattern.setMandatory(false)
    pattern.setTargetDays(0)
    pattern.setPriority(Priority.TC_NORMAL)
    pattern.setEscalationDays(21)
    return pattern
  }

  public static function updateAccountActivity(activity : Activity, account : Account, subject : String = "Default", description : String = "Default") : Activity {
    activity.setSubject(subject)
    activity.setDescription(description)
    activity.setAccount(account)
    activity.setMandatory(true)

    var user : User = User.util.CurrentUser

    activity.assignUserAndDefaultGroup(user)
    activity.setAssignedByUser(user)
    activity.assign(user.getRootGroup(), user)

    return activity

  }

  /**
   * Create an activity
   *
   * @param account
   * @return
   */
  public static function newActivity_ACC(account : Account, origionalStatus_ACC : StatusOfAccount_ACC, subject : String = "Default", description : String = "Default") : Activity {

    var pattern : ActivityPattern = getAccountActivityPattern_ACC()

    var activity = account.newActivity(pattern)
    activity = updateAccountActivity(activity, account, subject, description)

    return activity
  }


  public static function filterAccountStatus_ACC(account : Account) : List<StatusOfAccount_ACC> {
    var typeKeyList : List<StatusOfAccount_ACC>
    if (!perm.System.canChangeAccountStatusToActive_ACC) {
      if (account.AccountHolderContact typeis Company) {
        typeKeyList = StatusOfAccount_ACC.TF_COMPANYACTIVEREMOVED.getTypeKeys();
      } else {
        // Other wise it is a person
        typeKeyList = StatusOfAccount_ACC.TF_PERSONACTIVEREMOVED.getTypeKeys();
      }
    } else {
      if (account.AccountHolderContact typeis Company) {
        typeKeyList = typekey.StatusOfAccount_ACC.TF_COMPANY.getTypeKeys();
      } else {
        // Other wise it is a person
        typeKeyList = typekey.StatusOfAccount_ACC.TF_PERSON.getTypeKeys();
      }
    }
    return typeKeyList
  }

  public static function accountMenuDisplay(sessionItem : SessionItem) : String {
    // SessionItem Key is the GW account number
    // Find the account summary
    var accountSummary = Account.finder.findAccountSummaryByAccountNumber(sessionItem.Key)
    if (accountSummary != null) {
      return DisplayKey.get("Java.AccountTab.AccountItemLabel", accountSummary.ACCID_ACC != null ? accountSummary.ACCID_ACC : accountSummary.AEPContractNumber_ACC, accountSummary.AbbreviatedAccountHolderName)
    } else {
      return sessionItem.Label
    }
  }

  public static function accountHasBoundOrAuditedPeriod(account : Account) : boolean {
    return Query.make(PolicyPeriod)
        .compareIn(PolicyPeriod#Status, {PolicyPeriodStatus.TC_BOUND, PolicyPeriodStatus.TC_AUDITCOMPLETE})
        .join(PolicyPeriod#Policy)
        .compare(Policy#Account, Relop.Equals, account)
        .select()
        .getCountLimitedBy(1) > 0
  }

  public static function validateIRMobileField(VALUE : Boolean, contact : Contact) : String {
    return !ScriptParameters.AllowIRContactFieldsStatusChange_ACC and VALUE == Boolean.TRUE and
        VALUE != contact.IRPhoneVerifiedStatus_ACC ?
        DisplayKey.get("Web.ContactDetail.Exception.VerifiedChangeNotAllowed_ACC", DisplayKey.get("Web.ContactDetail.IRPhoneNumber")) :
        null
  }

  public static function validateIREmailField(VALUE : Boolean, contact : Contact) : String {
    return !ScriptParameters.AllowIRContactFieldsStatusChange_ACC and VALUE == Boolean.TRUE and
        VALUE != contact.IREmailVerifiedStatus_ACC ?
        DisplayKey.get("Web.ContactDetail.Exception.VerifiedChangeNotAllowed_ACC", DisplayKey.get("Web.ContactDetail.IREmailAddress")) :
        null
  }

  public static function crmResync(account : Account) {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      bundle.add(account).addEvent(CustomEvents.INTEGRATION_APIMGMT_ACCOUNT_RESYNC)
    })
  }
}