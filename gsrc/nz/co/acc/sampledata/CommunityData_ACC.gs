package nz.co.acc.sampledata

uses gw.api.database.Query
uses nz.co.acc.lob.util.ProducerUtil_ACC
uses gw.pl.persistence.core.Bundle
uses gw.sampledata.AbstractSampleDataCollection
uses gw.sampledata.tiny.TinySampleUWRuleData
uses gw.transaction.Transaction
uses nz.co.acc.migration.util.MigrationUtil_ACC

/**
 * A tiny set of Users / Groups / Orgs / ProducerCodes, just enough for testing.
 */
@Export
class CommunityData_ACC extends AbstractSampleDataCollection
{
  // Accident Compensation Corporation is the one Agency defined in this file.
  property get DefaultOrganizationName() : String {
    return "Accident Compensation Corporation"
  }

  construct() { }

  /**
   * The name of this sample data collection, for logging and debugging
   */
  public override property get CollectionName() : String {
    return "ACC Community"
  }
  
  /**
   * Checks the database, returning true if this set is already loaded (and thus doesn't need reloading)
   */
  public override property get AlreadyLoaded() : boolean {
    return credentialLoaded("teamlead")
  }
  
  /**
   * Loads the contents of this sample data set into the DB
   */
  public override function load() {
    // Underwriter Issue Types (in a separate bundle) so we can commit and rebuild cache
    //UWRuleData_ACC.load()

    Transaction.runWithNewBundle(\bundle -> {
      // ORGANIZATIONS
      var accOrg = loadOrganization(bundle, ProducerUtil_ACC.DEFAULT_ORGANIZATION_ACC, TC_INSURER, true, TC_ACTIVE, "HO UW")

      // A FEW ORGS HAVE COMPANY CONTACTS

      accOrg.Contact = loadCompany(bundle, "info@acc_foo.com", "213-555-1213", ProducerUtil_ACC.DEFAULT_ORGANIZATION_ACC, "79-83 Molesworth Street", "Wellington", "6000", "NZ")

      // AUTHORITY PROFILES
      var uwAuthData = new UWAuthorityData_ACC().loadUWAuthorityData(bundle)
      var underwriter1 = uwAuthData.Underwriter1
      var underwriter2 = uwAuthData.Underwriter2
      var underwriterManager = uwAuthData.UnderwriterManager
      var underwriterReassessment = uwAuthData.UnderwriterForReassessment
      var dfa1_ACC = uwAuthData.Dfa1_ACC
      var dfa12_ACC = uwAuthData.Dfa12_ACC
      var auditDfa1_ACC = uwAuthData.AuditDfa1_ACC
      var auditDfa12_ACC = uwAuthData.AuditDfa12_ACC

      // Make sure su has all the roles
      var su = findUser("su")
      su.addToUserAuthorityProfiles(new UserAuthorityProfile(bundle){:UWAuthorityProfile = underwriter1})
      su.addToUserAuthorityProfiles(new UserAuthorityProfile(bundle){:UWAuthorityProfile = underwriter2})
      su.addToUserAuthorityProfiles(new UserAuthorityProfile(bundle){:UWAuthorityProfile = underwriterManager})
      su.addToUserAuthorityProfiles(new UserAuthorityProfile(bundle){:UWAuthorityProfile = dfa1_ACC})
      su.addToUserAuthorityProfiles(new UserAuthorityProfile(bundle){:UWAuthorityProfile = auditDfa1_ACC})

      // Make sure sys has all the roles for batch processing
      var sys = findUser("sys")
      sys.addToUserAuthorityProfiles( new UserAuthorityProfile(bundle){:UWAuthorityProfile = underwriter1} )
      sys.addToUserAuthorityProfiles( new UserAuthorityProfile(bundle){:UWAuthorityProfile = underwriter2} )
      sys.addToUserAuthorityProfiles( new UserAuthorityProfile(bundle){:UWAuthorityProfile = underwriterManager} )
      sys.addToUserAuthorityProfiles( new UserAuthorityProfile(bundle){:UWAuthorityProfile = dfa1_ACC} )
      sys.addToUserAuthorityProfiles( new UserAuthorityProfile(bundle){:UWAuthorityProfile = auditDfa1_ACC} )

      // Add in the renewal daemon user
      loadUser(bundle, {"superuser"}, TC_OTHER, accOrg, false, false,
          "renewal_daemon", null, "Renewal", "Daemon", "213-555-8164",
          null, null, null, null, null, {underwriter1})

      // Add in the policy change daemon user
      loadUser(bundle, {"superuser"}, TC_OTHER, accOrg, false, false,
          "policychange_daemon", null, "PolicyChange", "Daemon", "213-555-8164",
          null, null, null, null, null, {underwriter1, underwriter2, underwriterManager, dfa12_ACC})

      // USERS

      // csr - customer service representative
      var csr = loadUser(bundle, {"superuser"}, TC_OTHER, accOrg, false, false,
          "csr", "csr@acc_foo.com", "Customer Service", "Representative", "111-1111",
          "445 Mount Eden Road", "Pasadena", null, "1234", "NZ", {underwriter1, dfa12_ACC, auditDfa12_ACC, underwriterManager})
      // basic changes user - chuser
      var teamlead = loadUser(bundle, {"superuser"}, TC_ASSISTANT, accOrg, false, false,
          "teamlead", "teamlead@acc_foo.com", "Team", "Lead", "1234-567890",
          "21 Greens Road RD 2", "Pasadena", null, "1234", "NZ", {underwriter1, dfa12_ACC, auditDfa12_ACC, underwriterReassessment, underwriterManager})
      // renewals user - renuser
      var underwriter = loadUser(bundle, {"superuser"}, TC_PRODUCER, accOrg, false, false,
          "underwriter", "underwriter@acc_foo.com", "Underwriter", "", "333-3333",
          "222C Apperly Street", "Pasadena", null, "1234", "NZ", {underwriter1, underwriter2, underwriterManager, dfa12_ACC, auditDfa12_ACC, underwriterReassessment})
      // experienced rating user - eruser
      var admin = loadUser(bundle, {"superuser"}, TC_PRODUCER, accOrg, false, false,
          "admin", "admin@acc_foo.com", "Admin", "", "333-3333",
          "20 Addinell Lane", "Pasadena", null, "1234", "NZ", {underwriter1, underwriter2, underwriterManager, dfa12_ACC})
      // Retained from OOTB - the supervisor of the region
      var svisor = loadUser(bundle, {"superuser"}, TC_UNDERWRITER, accOrg, false, false,
          "svisor", "svisor@acc_foo.com", "Super", "Visor", "213-555-8164",
          "143 Lake Ave. Suite 501", "Pasadena", null, "1234", "NZ", {underwriter1, underwriter2, underwriterManager, dfa12_ACC})

      var aapplegate = loadUser(bundle, {"superuser"}, TC_UNDERWRITER, accOrg, false, false,
          "aapplegate", "aapplegate@enigma_fc.com", "Alice", "Applegate", "213-555-8164",
          "143 Lake Ave. Suite 501", "Pasadena", null, "9125", "NZ", {underwriter1, dfa12_ACC})

      var suacc = loadUser(bundle, {"superuser"}, TC_OTHER, accOrg, false, false,
          "suacc", "superuser@acc.co.nz", "Super", "User ACC", "213-555-8164",
          "1 Welington Street", "Wellington", null, "6001", "NZ", {underwriter1, underwriter2, underwriterManager, dfa1_ACC, dfa12_ACC, auditDfa1_ACC, underwriterReassessment})

      var billen = loadUser(bundle, {"superuser"}, TC_OTHER, accOrg, false, false,
          "billen", "billen@acc.co.nz", "Bill", "English", "212-544-8141",
          "34 Okinawa Street", "Wellington", null, "6034", "NZ", {underwriter1, underwriter2, underwriterManager})


      /*
        Add user for automation testing each with a level of DFA

        <user-1>  = DFA limit 0$       (DFA-13)
        <user-2>  = DFA limit 2500$    (DFA-11)
        <user-3>  = DFA limit 19999$   (DFA-7)
        <user-4>  = DFA limit 50000$   (DFA-5)
        <user-5>  = DFA limit 1000000$ (DFA-1)

       */

      var automationUsers : List<User> = new ArrayList<User>()
      var uwAuthProfiles = new UWAuthorityProfile[]{uwAuthData.Dfa13_ACC, uwAuthData.Dfa11_ACC, uwAuthData.Dfa7_ACC, uwAuthData.Dfa5_ACC, uwAuthData.Dfa1_ACC}
      var auditUwAuthProfiles = new UWAuthorityProfile[]{uwAuthData.AuditDfa13_ACC, uwAuthData.AuditDfa11_ACC, uwAuthData.AuditDfa7_ACC, uwAuthData.AuditDfa5_ACC, uwAuthData.AuditDfa1_ACC}

      for (1 .. 5 index n) {
        var username = "user-${n + 1}"
        automationUsers.add(loadUser(bundle,
            {"superuser"},
            TC_ASSISTANT, accOrg, false, false,
            username, "${username}@acc_foo.com", username, "Automation", "1234-567890",
            "${n + 1} Automation Road", "Wellington", null, "1234", "NZ", {uwAuthProfiles[n], auditUwAuthProfiles[n]}))
      }

      var users : List<User> = {csr, teamlead, underwriter, admin, suacc, billen}
      users.addAll(automationUsers)

      // GROUPS
      var wlgRgnGrp = loadGroup(bundle, "Wellington Region", accOrg.RootGroup, TC_REGION, "HO UW", svisor, users.toTypedArray(), "", accOrg, "Wellington Region")
      var wlgBrnchGrp = loadGroup(bundle, "Wellington City", wlgRgnGrp, TC_BRANCH, "HO UW", svisor, new User[]{svisor}, "", accOrg, "Thorndon Branch - HI")
      var wlgBrnchUwGrp = loadGroup(bundle, "Wellington City UW", wlgBrnchGrp, TC_BRANCHUW, "Wellington Region", svisor, new User[]{svisor}, "1234", accOrg, "")

      // ASSIGNABLE QUEUES HERE

      // PRODUCER CODES
      var org = loadOrganization(bundle, "External Auditors", TC_FEEAUDIT, false, null, "Wellington Region")


      loadProducerCode(bundle, ProducerUtil_ACC.DEFAULT_PRODUCER_CODE_ACC, ProducerUtil_ACC.DEFAULT_ORGANIZATION_ACC,
          wlgBrnchUwGrp, accOrg, new Group[]{}, new User[]{svisor},
          "143 Lake Ave. Suite 501", "Pasadena", null, "1234", "NZ")

      loadUser(bundle, {"superuser"}, TC_AUDITOR, org, true, false,
          "tjohnson", "tjohnson@c.com", "Terence", "Johnson", "213-555-8164",
          "143 Lake Ave. Suite 501", "Pasadena", null, "1234", "NZ", {})

      loadUser(bundle, "superuser", TC_OTHER, org, true, true,
          "acareful", "admin@external.com", "Admin", "Careful", "213-555-8164",
          "143 Lake Ave. Suite 501", "Pasadena", null, "1234", "NZ")
    })
  }

  /**
   * Load a new role, create if needed.
   *
   * @param bundle the transaction bundle
   * @param roleName the role name
   * @return the role
   */
  static function loadRole(bundle : Bundle, roleName : String) : Role {
    var roleQuery = Query.make(Role).compare(Role#Name, Equals, roleName)
    var role = roleQuery.select().AtMostOneRow
    if (role == null) {
      role = new Role(){:Name = roleName}
    } else {
      role = bundle.add(role)
    }
    return role
  }
}
