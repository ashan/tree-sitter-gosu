package nz.co.acc.plm.integration.ir.exec.handler.actions.earningsupdate

uses entity.Address
uses entity.Contact
uses entity.PolicyLine
uses gw.api.util.DisplayableException
uses gw.pl.currency.MonetaryAmount
uses gw.util.GosuStringUtil

uses nz.co.acc.integration.ir.record.CARA5Record
uses nz.co.acc.integration.ir.record.handler.exception.CARA5Exception
uses nz.co.acc.plm.common.configurationservice.ConfigurationProperty
uses nz.co.acc.plm.integration.ir.exec.handler.actions.ActionsUtil
uses nz.co.acc.plm.integration.ir.util.IRAccountHelper
uses nz.co.acc.plm.util.ActivityUtil
uses gw.surepath.suite.integration.logging.StructuredLogger
uses productmodel.CWPSLine

uses java.lang.invoke.MethodHandles
uses java.math.BigDecimal
uses java.util.regex.Pattern

/**
 * Created by Swati Patel on 13/04/2017.
 */
class ShareholderUpdateAction extends EarningsUpdatePolicyActions {

  private static final var _log = StructuredLogger.INTEGRATION.withClass(MethodHandles.lookup().lookupClass())

  // This value is sent through when the ACC number for the shareholder is unknown
  public static final var DEFAULT_ACC_NUMBER : String = "A0000000"
  public static final var DEFAULT_NAME : String = "UNKNOWN"

  // This filler is used for the dummy addresses assigned to shareholders.
  private static final var DUMMY_ADDRESS_FILLER = "Unknown"
  private static final var DELIMITER = ' '  //Name field delimiter is spaces

  private static final var SHAREHOLDER_COMPANY_PATTERN = Pattern.compile(
      ConfigurationProperty.SHAREHOLDER_IS_COMPANY_PATTERN.PropertyValue, Pattern.CASE_INSENSITIVE)

  private var _contactMap : HashMap<String, Contact>
  private var _cara5Records : Set<CARA5Record>
  private var _premiumYear : Integer

  construct(record : CARA5Record) {
    super(record.PremiumYear, record.BalanceDate)
    this._cara5Records = {record}
    this._premiumYear = record.PremiumYear
    this._contactMap = new HashMap<String, Contact>(1)
  }

  construct(records : Set<CARA5Record>) {
    super(records.first().PremiumYear, records.first().BalanceDate)
    this._cara5Records = records.toSet()
    this._premiumYear = records.first().PremiumYear
    this._contactMap = new HashMap<String, Contact>(records.Count)
  }

  protected override function createCoveragesForPolicyChange(lines : PolicyLine[]) {
    updateShareholders(lines[0] as CWPSLine)
  }

  protected override function getPolicyLineType() : typekey.PolicyLine {
    return typekey.PolicyLine.TC_CWPSLINE
  }

  protected override function finalAuditRequired() : boolean {
    return true
  }

  protected override function policyChangeRequired(policyPeriod : PolicyPeriod) : boolean {
    // Is it ceased - if so do not update
    if (policyPeriod.PolicyTerm.CeasedTrading_ACC) {
      return false
    }

    var provTargets = new IRAccountHelper(EarningsAccount).findPolicyTargets_ACC(_premiumYear + 1, recordType(), EarningsBundle)
    var provTarget : PolicyPeriod

    if (provTargets != null) {
      provTarget = provTargets.first()
    }

    if (provTarget == null) {
      return true
    }
    // If a FA already exists for the target year, we DO NOT create a provisional.
    if (provTarget.PolicyTerm.hasFinalAudit_ACC()) {
      return false
    }

    for (period in provTarget.PolicyTerm.Periods) {
      // If manual policy change, check if total remuneration changed
      if (!period.Job.InternalJob_ACC && period.Job.Subtype == typekey.Job.TC_POLICYCHANGE && period.Status == PolicyPeriodStatus.TC_BOUND) {
        var periodShareholders = period.CWPSLine.PolicyShareholders
        var basedOnPeriodShareholders = period.BasedOn.CWPSLine.PolicyShareholders

        var periodRemunerationTotal = new BigDecimal(0)

        for (shareholder in periodShareholders) {
          periodRemunerationTotal += shareholder.ShareholderEarnings.first().Remuneration.Amount
        }

        var basedOnPeriodRemunerationTotal = new BigDecimal(0)

        for (shareholder in basedOnPeriodShareholders) {
          basedOnPeriodRemunerationTotal += shareholder.ShareholderEarnings.first().Remuneration.Amount
        }

        if (periodRemunerationTotal != basedOnPeriodRemunerationTotal) {
          return false
        }
      }
    }
    return true
  }

  protected override function updateCoveragesForFinalAudit(info : AuditInformation) {
    updateShareholders(info.Audit.PolicyPeriod.CWPSLine)
  }

  protected override function getMaxYearsInPast() : int {
    return ScriptParameters.getParameterValue("IRWPSMaxYearsBack_ACC") as int
  }

  protected override function recordType() : IRExtRecordType_ACC {
    return IRExtRecordType_ACC.TC_CARA5
  }

  protected override function validateShareholdersCU(policyPeriod : PolicyPeriod, account : Account) {
    // Check CU Code not different from primary
    var primaryCU = policyPeriod.Lines[0].PrimaryBICCode_ACC.CUCode
    var shareholders = (policyPeriod.Lines[0] as CWPSLine).PolicyShareholders

    for (shareholder in shareholders) {
      var shareholderCU = shareholder.ShareholderEarnings.first().CUCode
      if (shareholderCU != primaryCU) {

        var errorMsg = {"Shareholder with different CU to the primary.",
            "Shareholder ACCID: ${shareholder.ContactDenorm.ACCID_ACC}",
            "Shareholder CU: ${shareholderCU}",
            "Primary CU: ${primaryCU}"}.join(" ")

        _log.error_ACC(errorMsg)

        gw.transaction.Transaction.runWithNewBundle(\b -> {
          account = b.add(account)
          new ActivityUtil().shareholderCUDifferentFromPrimary(account, _cara5Records.first().InboundRecordPublicID)
        })
        throw new RuntimeException("Cannot process shareholder earnings for account: ${account.ACCID_ACC} due to CU Code not same as primary")
      }
    }
  }

  private function updateShareholders(line : CWPSLine) {
    _log.info("Updating ${_cara5Records.Count} shareholder records")

    removeAllShareholders(line)

    for (record in _cara5Records index i) {
      _log.info("updateShareholder ${i + 1} of ${_cara5Records.Count}: ${record}")
      try {
        updateShareholder(record, line)
      } catch (e : Exception) {
        throw new CARA5Exception(record.InboundRecordPublicID, e)
      }
    }
  }

  private function updateShareholder(cara5Record : CARA5Record, line : CWPSLine) {
    // Either find the contact if they already exist or create a new one
    var isDefaultAccNumber = false
    var isDefaultName = false
    var isCompany = false
    var contact : Contact

    // Do we have the contact already - when we are updating the provisional, we DO NOT want to look up the contact again,
    // because we already looked it up for the final audit.

    // Note that for each action, _currentContact is initialised back to null, so in the case that this is a default
    // ACC number, we do create separate contacts for distinct default contacts.
    if (cara5Record.InboundRecordPublicID == null) {
      throw new RuntimeException("InboundRecordPublicID is null for shareholder ${cara5Record}")
    }
    if (_contactMap.containsKey(cara5Record.InboundRecordPublicID)) {
      contact = _contactMap.get(cara5Record.InboundRecordPublicID)
    }

    // TODO this code is a bit fragile/badly written and could do with a refactor

    // If no ACC ID we must always set it to the default.  Names have different rules.
    if (GosuStringUtil.isBlank(cara5Record.ACCNumberShareholder)) {
      cara5Record.ACCNumberShareholder = DEFAULT_ACC_NUMBER
      if (GosuStringUtil.isBlank(cara5Record.Name)) {
        cara5Record.Name = DEFAULT_NAME
        isDefaultName = true
      }
    }

    if (GosuStringUtil.isBlank(cara5Record.Name)) {
      cara5Record.Name = DEFAULT_NAME
      isDefaultName = true
    }

    if (not isDefaultName) {
      isCompany = determineIfCompany(cara5Record.Name)
    }

    // Check if it's a default ACC number before looking up.
    if (contact == null and cara5Record.ACCNumberShareholder != DEFAULT_ACC_NUMBER) {
      if (isCompany) {
        contact = ActionsUtil.getCompanyByAccNumber(cara5Record.ACCNumberShareholder)
      } else {
        contact = ActionsUtil.getPersonByAccNumber(cara5Record.ACCNumberShareholder)
      }
      _contactMap.put(cara5Record.InboundRecordPublicID, contact)

    } else {
      isDefaultAccNumber = true
    }

    if (contact == null) {
      if (isCompany) {
        contact = new Company()
        contact.Name = cara5Record.Name

      } else {
        contact = new Person()
        var person = contact as Person

        if (not isDefaultName) {
          updateContactName(person, cara5Record)
        } else {
          person.FirstName = cara5Record.Name
          person.LastName = cara5Record.Name
        }
      }

      // We have a contact now.
      _contactMap.put(cara5Record.InboundRecordPublicID, contact)

      contact.ACCID_ACC = cara5Record.ACCNumberShareholder

      if (isDefaultAccNumber) {
        contact.DummyContact_ACC = true
      }

      // Assign a dummy address for the shareholder contact
      var address = createDummyAddress()
      contact.addAddress(address)

      // We only add the contact to the bundle if it is new
      contact = EarningsBundle.add(contact)

    }  //Contact exists
    else {

      if (contact typeis Company) {
        if (GosuStringUtil.isBlank(cara5Record.Name)) {
          cara5Record.Name = contact.Name
        }

      } else if (contact typeis Person) {

        // if shareholder name is blank, set it from the contact
        if (GosuStringUtil.isBlank(cara5Record.Name)) {
          if (cara5Record.Name == null) {
            cara5Record.Name = ""
          }
          cara5Record.Name = appendIfNotNull(cara5Record.Name, contact.Prefix?.toString())
          cara5Record.Name = appendIfNotNull(cara5Record.Name, contact.FirstName)
          cara5Record.Name = appendIfNotNull(cara5Record.Name, contact.MiddleName)
          cara5Record.Name = appendIfNotNull(cara5Record.Name, contact.LastName)
        }
      }
    }

    // We have a value for shareholder name by this point
    // Remove extra whitespace
    cara5Record.Name = cara5Record.Name?.replaceAll("\\s+", DELIMITER)

    var shareholder = getCreateShareholder(contact, line, cara5Record)

    validateRemuneration(cara5Record, line)
    computeEarnings(shareholder, line, cara5Record)

    shareholder.ShareholderNameIR_ACC = cara5Record.Name
  }

  private function getCreateShareholder(contact : Contact, line : CWPSLine, cara5Record : CARA5Record) : PolicyShareholder_ACC {
    // Add the contact to the policy
    var shareholder = line.getShareholderFromContact(contact)
    if (shareholder == null) {
      // Add the contact to the policy
      _log.info("Adding shareholder ${cara5Record.ACCNumberShareholder}")
      shareholder = line.addNewPolicyShareholderForContact(contact)
      shareholder.PolicyContact.ACCID_ACC = cara5Record.ACCNumberShareholder
    }
    return shareholder
  }

  private function computeEarnings(shareholder : PolicyShareholder_ACC, line : CWPSLine, cara5Record : CARA5Record) {
    var shareholderEarnings = shareholder.ShareholderEarnings.first()
    shareholderEarnings.Remuneration = new MonetaryAmount(cara5Record.Remuneration, defaultCurrency)
    shareholderEarnings.CUCode = line.PrimaryBICCode_ACC.CUCode
    shareholderEarnings.computeShareholderEarnings()
  }

  private function validateRemuneration(cara5Record : CARA5Record, line : CWPSLine) {
    if (cara5Record.Remuneration < 0) {
      throw new RuntimeException("Negative remuneration: ${cara5Record.Remuneration}")
    }
  }

  private function appendIfNotNull(target : String, s : String) : String {
    if (s != null) {
      return target + " " + s
    } else {
      return target
    }
  }

  private function updateContactName(contact : Person, cara5Record : CARA5Record) {
    var list = cara5Record.Name.split(DELIMITER)
    var count = list.Count

    for (token in list) {
      var str = token
      if (str != null) {
        if (contact.Prefix == null and NamePrefix.get(str.toLowerCase()) != null) {
          contact.Prefix = NamePrefix.get(str.toLowerCase())
        } else if (contact.FirstName == null) {
          contact.FirstName = str
        } else if (count > 1) {
          if (contact.MiddleName != null) {
            contact.MiddleName = contact.MiddleName + " " + str
          } else {
            contact.MiddleName = str + " "
          }
        } else {
          contact.LastName = str
        }
      }
      count = count - 1
    }
  }

  private function determineIfCompany(name : String) : boolean {
    if (name == DEFAULT_NAME) {
      return false
    }

    if (name == null) {
      return false
    }

    if (name.split(DELIMITER).Count == 1) {
      return true
    }

    return SHAREHOLDER_COMPANY_PATTERN.matcher(name).find()
  }

  private function removeAllShareholders(line : CWPSLine) : void {
    for (shareholder in line.PolicyShareholders) {
      line.removePolicyShareholder(shareholder)
    }
  }

  /**
   * Creates a new dummy address for a shareholder.
   *
   * @return address
   */
  private function createDummyAddress() : Address {
    var address = new Address()
    address.AddressLine1 = DUMMY_ADDRESS_FILLER
    address.City = DUMMY_ADDRESS_FILLER
    address.PostalCode = DUMMY_ADDRESS_FILLER
    address.Country = Country.TC_UNKNOWN_ACC
    address.AddressType = AddressType.TC_IRACC
    address.AddressLocType_ACC = AddressLocationType_ACC.TC_POSTAL
    address.AddressPolicyType_ACC = AddressPolicyType_ACC.TC_WPS
    address.ValidUntil = Date.Now
    return address
  }

}
