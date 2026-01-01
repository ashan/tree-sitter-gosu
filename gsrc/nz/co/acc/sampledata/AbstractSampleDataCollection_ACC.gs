package nz.co.acc.sampledata

uses edge.util.helper.UserUtil
uses gw.api.builder.AccountBuilder
uses gw.api.builder.AddressBuilder
uses gw.api.builder.CompanyBuilder
uses gw.api.builder.PersonBuilder
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.system.PLDependenciesGateway
uses gw.transaction.Transaction
uses gw.transaction.Transaction.BlockRunnable
uses nz.co.acc.lob.util.ProducerUtil_ACC
uses com.guidewire.pl.system.dependency.PLDependencies

uses java.util.concurrent.atomic.AtomicInteger


/**
 * A "collection" in this context is one PART of a SampleDataSet, for instance
 * all the community entities in the Foo data set.
 */
@Export
abstract class AbstractSampleDataCollection_ACC {
  private static var _publicIdCounter = new AtomicInteger(1)

  protected construct() {
  }

  /**
   * This method will run a block of code as a specific user, if that user is specified
   * and is different from the current user. It is still worth it to call this method as it will
   * wrap any exception so that the added information is available in the stack trace.
   *
   * @param userName this is the string with the username (the login name), null will default to the current user
   * @param blk      anything gosu expression
   */
  protected static function runBlockAsUser(userName: String, title: String, blk: Runnable) {
    var oldToken = PLDependenciesGateway.getCommonDependencies().getServiceToken()
    try {
      if (userName != null and oldToken.User.Credential.UserName != userName) {
        var user = PLDependencies.getUserFinder().findByCredentialName(userName)
        var token = PLDependenciesGateway.getServiceTokenManager().createAuthenticatedToken(user?.ID)
        PLDependenciesGateway.getCommonDependencies().setServiceToken(token)
      }
      blk.run()
    } catch (e: Throwable) {
      print("Uncaught throwable in runBlockAsUser while running ${title}")
      e.printStackTrace()
    } finally {
      PLDependenciesGateway.getCommonDependencies().setServiceToken(oldToken)
    }
  }

  /**
   * This method will run a block of code, with a provided bundle, as a specific user, if that user is specified
   * and is different from the current user.  It is still worth it to call this method as it will
   * wrap any exception so that the added information is available in the stack trace.
   *
   * @param userName this is the string with the username (the login name), null will default to the current user
   * @param title    this is a string added to the runtime exception thrown,
   *                 use it it will make debugging load problems more managable
   * @param blk      any gosu expression, it will be supplied a bundle
   */
  protected static function runTransactionAsUser(userName: String, title: String, blk: BlockRunnable) {
    runBlockAsUser(userName, title, \-> Transaction.runWithNewBundle(blk))
  }

  protected static function findUser(credentialName: String): User {
    if (credentialName == null) {
      return null
    }
    var user = PLDependencies.getUserFinder().findByCredentialName(credentialName)
    if (user == null) {
      throw "Could not find user " + credentialName + "."
    }
    return user
  }

  protected static function buildPerson(migrated: boolean, accNumber: String, firstName: String, lastName: String, address: AddressBuilder, isDummy: boolean = false): PersonBuilder {

    var builder = new PersonBuilder_ACC()
        .withDummyContact(isDummy)
        .withAccountNumber(accNumber)
        .withMigratedStatus(migrated)
        .withFirstName(firstName)
        .withLastName(lastName)
        .withAddress(address)
        .withGender(GenderType.TC_M)
        .withDateOfBirth("12/07/1990".toDate())
        .withPrefix(NamePrefix.TC_MR)
        .withMiddleName("MidName")
        .withPrimaryPhone(PrimaryPhoneType.TC_HOME)
        .withHomePhone("043213210")
        .withWorkPhone("046546547")
        .withCellPhone("0213213000")
        .withFax("0211112222")
        .withCellPhoneCountry(PhoneCountryCode.TC_NZ)
        .withEmailAddress1("primary@email.com")
        .withEmailAddress2("secondary@email.com")


    return builder
  }

  protected static function buildCompany(migrated: boolean, accNumber: String, name: String, isAEP: boolean, address: AddressBuilder_ACC): CompanyBuilder {

    var builder = new CompanyBuilder_ACC()
    builder
        .withAccountNumber(accNumber)
        .withMigratedStatus(migrated)
        .withCompanyName(name)
        .withPrimaryAddress(address)
        .withPrimaryPhone(PrimaryPhoneType.TC_WORK)
        .withWorkPhone("046546540")
        .withFax("0213213210")
        .withEmailAddress1("primary@email.com")
        .withEmailAddress2("secondary@email.com")

    if (not isAEP) {
      builder.withPrimaryACCNumber("D12311122")
    }

    return builder

  }

  public static function makeAddressBuilder(attention: String, addressType: AddressType,
                                               addressLocationType: AddressLocationType_ACC,
                                               addressPolicyType: AddressPolicyType_ACC,
                                               addressLine1: String,
                                               addressLine2: String,
                                               addressLine3: String,
                                               addressCity: String,
                                               addressState: State,
                                               postalCode: String,
                                               addressCountry: Country): AddressBuilder_ACC {
    return new AddressBuilder_ACC()
        .withAttention(attention)
        .withAddressLocationType(addressLocationType)
        .withAddressPolicyType(addressPolicyType)
        .asType(addressType)
        .withAddressLine1(addressLine1)
        .withAddressLine2(addressLine2)
        .withAddressLine3(addressLine3)
        .withCity(addressCity)
        .withState(addressState)
        .withPostalCode(postalCode)
        .withCountry(addressCountry) as AddressBuilder_ACC
  }

  /**
   * Returns true if a account with the given account number exists, false otherwise.
   *
   * @param accountNumber the account number to search against.
   */
  protected static function accountLoaded(accountNumber: String): boolean {
    var accountQuery = Query.make(Account).compare(Account#AccountNumber, Equals, accountNumber)
    return accountQuery.select().HasElements
  }

  /**
   * Returns true if a policy with the given policy number exists, false otherwise.
   *
   * @param policyNumber the policy number to search against.
   */
  protected static function policyLoaded(): boolean {
    var policyQuery = Query.make(PolicyPeriod)
    return policyQuery.select().HasElements

  }

  protected static function findCompany(name: String, workPhone: String): Company {
    var query = Query.make(Company)
    query.compare("Name", Equals, name)
    query.compare("WorkPhone", Equals, workPhone)
    return query.select().AtMostOneRow
  }

  public static function loadCompanyAccount(migrated: boolean, isAEP: boolean, irdNumber: String, accNumber: String,
                                               accountNumber: String, tradingName: String, companyName: String, nzbn: String,
                                               address: AddressBuilder_ACC, userName: String, taxTypeEndDate: Date, aepDetails: String[] = null): Account {

    var result: Account
    runTransactionAsUser(null, "CompanyAccount " + accountNumber, \b -> {
      var builder = new AccountBuilder(false)
          .withDefaultACCProducerCode()
          .withRelationshipManager(findUser(userName))
          .withIRDNumber(irdNumber)
          .withACCId(accNumber)
          .withTradingName(tradingName)
          .withBalanceDate("09/08/2005".toDate())
          .withTradingName(tradingName)
          .withMigrationStatus(migrated)
          .withNZBN(nzbn)
          .withTaxTypeEndDate(taxTypeEndDate)
          .withSource(Source_ACC.TC_MANUAL)

      if (isAEP and aepDetails != null and aepDetails.length == 2) {
        builder.asAEPAccount()
            .withAEPContractNumber(aepDetails[0])
            .withAEPAgreementOrigSignedDate(aepDetails[1].toDate())
      }

      builder.withAccountNumber(accountNumber)
          .withAccountOrgType(AccountOrgType.TC_LLC)
          .withBusinessDescription("Business Description")

      builder.withAccountHolderContact(buildCompany(migrated, accNumber, companyName, isAEP, address))

      result = builder.create(b)
    })

    return result
  }

  private static function findProducerCode(): ProducerCode {
    // the ACC producer code
    var query = Query.make(ProducerCode)
    query.compare(ProducerCode#Code, Relop.Equals, ProducerUtil_ACC.DEFAULT_PRODUCER_CODE_ACC)
    var result = query.select().AtMostOneRow
    return result
  }

  protected static function findPerson(firstName: String, lastName: String, ssn: String = null): Person {
    var query = Query.make(Person)
    query.compare("FirstName", Equals, firstName)
    query.compare("LastName", Equals, lastName)
    if (ssn != null) {
      query.compare("TaxID", Equals, ssn)
    }
    return query.select().AtMostOneRow
  }

  protected static function loadPersonAccount(migrated: boolean, irdNumber: String, accNumber: String, accountNumber: String,
                                              firstName: String, lastName: String, tradingName: String, nzbd: String,
                                              address: AddressBuilder_ACC, userName: String, taxTypeEndDate: Date): Account {
    var result: Account

    runTransactionAsUser(null, "PersonalAccount " + accountNumber, \b -> {
      var builder = new AccountBuilder(false).withDefaultACCProducerCode()
          .withRelationshipManager(findUser(userName))
          .withBalanceDate("07/12/54".toDate())
          .withIRDNumber(irdNumber)
          .withACCId(accNumber)
          .withTradingName(tradingName)
          .withMigrationStatus(migrated)
          .withNZBN(nzbd)
          .withTaxTypeEndDate(taxTypeEndDate)
          .withAccountNumber(accountNumber)


      var personBuilder = buildPerson(migrated, accNumber, firstName, lastName, address)
      builder.withAccountHolderContact(personBuilder)
      result = builder.create(b)
    })

    return result
  }

  protected static function findAccount(accountNumber: String): Account {
    var accountQuery = Query.make(Account).compare(Account#AccountNumber, Equals, accountNumber)
    return accountQuery.select().AtMostOneRow
  }

  /**
   * Return the name of this collection.  Subclasses must override.
   */
  public abstract property get CollectionName(): String

  /**
   * Return true if this data collection has already been loaded into the DB.
   * Subclasses should check this using finders.  Subclasses must override.
   */
  public abstract property get AlreadyLoaded(): boolean

  /**
   * The user we should run as when loading the data.  Subclasses can override
   */
  property get RunAsUser(): String {
    return "su"
  }

  /**
   * Loads all the data in this collection.  Subclasses must override.
   */
  public abstract function load()

}
