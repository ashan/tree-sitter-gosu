package gw.sampledata.search

uses gw.api.builder.PolicyChangeBuilder
uses gw.api.builder.RenewalBuilder
uses gw.api.builder.SubmissionBuilder
uses gw.api.database.Query
uses gw.api.databuilder.wc.WCSubmissionBuilder
uses gw.api.system.PCLoggerCategory
uses gw.sampledata.AbstractSampleDataCollection
uses gw.sampledata.small.SmallSampleCommunityData
uses gw.sampledata.small.SmallSampleRegionData
uses gw.sampledata.tiny.TinySampleCommunityData
uses gw.sampledata.tiny.TinySampleRegionData

/**
 * Adds a large number of producer codes to the "chart" user in the "Allrisk Insurance" agency, both from existing
 * sample data.
 */
@Export
class LargeSampleProducerCodeSearchData extends AbstractSampleDataCollection {
  override property get CollectionName() : String {
    return "Large number of producer codes"
  }

  override property get AlreadyLoaded() : boolean {
    return jobLoaded("41489393842")
  }

  override function load() {
    // Ensure that prerequisite data is loaded
    loadCollection(new TinySampleRegionData())
    loadCollection(new TinySampleCommunityData())
    loadCollection(new SmallSampleRegionData())
    loadCollection(new SmallSampleCommunityData())

    // Load producer codes
    loadProducerCodes()

    // Add some sample accounts and policies
    loadAccountsAndPolicies()
  }

  /**
   * Add 2500 producer codes to the user "chart" and the agency "Allrisk Insurance". As a side effect, producer codes
   * are also added to "Harliquin and Daughter Insurance", to ensure that producer codes for an organization do not have
   * consecutive IDs.
   */
  private static function loadProducerCodes() {
    var uwGroup = findGroup("Los Angeles Branch UW")
    var org = Query.make(entity.Organization).compare(Organization#Name, Equals, "Allrisk Insurance").select().single()
    var org2 = Query.make(Organization).compare(Organization#Name, Equals, "Harliquin and Daughter Insurance").select().single()

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC( \bundle ->  {
      var user = bundle.add(findUser("chart"))

      for (i in 1..2500) {
        loadProducerCode(bundle, "f00-"+(i+1000)+"bbbb", "Harliquin and Daughter Insurance", uwGroup, org2, null, null)
        loadProducerCode(bundle, "g00-"+(i+1000)+"bbbb", "Allrisk Insurance", uwGroup, org, null, {user}, "4460 Boulder Drive", "Tampa", State.TC_FL, "33605", "US")
        if (i % 100 == 0) {
          PCLoggerCategory.SAMPLE_DATA.info("Loading producer code ${i}")
        }
      }
    })
  }

  /**
   * Add a few accounts and policies with producer codes that user "chart" can access.
   */
  private static function loadAccountsAndPolicies() {
    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      loadPerson(bundle, TC_MR, "Bob", "Bobbert", TC_WORK, "818-446-1206", null, TC_HOME, "1253 Paloma Ave", "Arcadia", TC_CA, "91007", "US")
      loadCompany(bundle, "Bill's Boots", "818-446-1206", null, false, TC_BUSINESS, "846 Yount Ln.", "Hollywood", TC_CA, "91357", "US")
    })

    var companyAccount = loadCompanyAccount("C4148939384", null, "Bill's Boots", "1522", "212-379-4412", {})
    var personAccount = loadPersonAccount("P9344732543", "Bob", "Bobbert", {"Bill's Boots"})

    gw.transaction.Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      var paSubmission = new SubmissionBuilder()
          .withJobNumber("93447325432")
          .withProduct("PersonalAuto")
          .withAccount(personAccount)
          .withProducer("501-002552")
          .create(bundle)
      new PolicyChangeBuilder()
          .withBasedOnPeriod(paSubmission)
          .withJobNumber("6187394384")
          .isDraft()
          .create(bundle)
      var wcSubmission = new WCSubmissionBuilder()
          .withJobNumber("41489393842")
          .withAccount(companyAccount)
          .withProducer("501-002552")
          .create(bundle)
      new RenewalBuilder()
          .withBasedOnPeriod(wcSubmission)
          .withJobNumber("5394837483")
          .isDraft()
          .create(bundle)
    })
  }

  private static function loadCollection(collection : AbstractSampleDataCollection) {
    if (!collection.AlreadyLoaded) {
      runBlockAsUser("sys", "Loading ${collection.CollectionName}", \ -> collection.load())
    }
  }
}