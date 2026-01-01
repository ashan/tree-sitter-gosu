package gw.sampledata

uses com.guidewire.pl.system.integration.messaging.dispatch.QPlexorForwardingProxy
uses gw.acc.npg.builders.ProductLineBuilder
uses gw.api.archive.PCArchivingUtil
uses gw.api.database.Query
uses gw.api.database.Relop
uses gw.api.system.PCLoggerCategory
uses gw.api.system.PLDependenciesGateway
uses gw.plugin.Plugins
uses gw.plugin.rateflow.RateBookEvent
uses gw.plugin.rateflow.RateBookPreloadPlugin
uses gw.sampledata.forms.AllSampleFormData
uses gw.sampledata.large.LargeSampleAccountData
uses gw.sampledata.large.LargeSampleArchivedPoilcyData
uses gw.sampledata.large.LargeSamplePolicyData
uses gw.sampledata.large.LargeSamplePurgeablePolicyData
uses gw.sampledata.large.LargeSamplePurgedPolicyData
uses gw.sampledata.monolinejobstatus.ProductXJobStatusPolicyData
uses gw.sampledata.search.SearchSampleAccountData
uses gw.sampledata.search.SearchSampleContactData
uses gw.sampledata.search.SearchSamplePolicyData
uses gw.sampledata.small.SmallSampleAccountData
uses gw.sampledata.small.SmallSampleCommunityData
uses gw.sampledata.small.SmallSampleContactData
uses gw.sampledata.small.SmallSampleLookupData
uses gw.sampledata.small.SmallSamplePolicyData
uses gw.sampledata.small.SmallSampleRatingData
uses gw.sampledata.small.SmallSampleRegionData
uses gw.sampledata.small.SmallSampleReinsuranceData
uses gw.sampledata.small.SmallSampleUWRuleData
uses gw.sampledata.tiny.TinySampleCommunityData
uses gw.sampledata.tiny.TinySampleContactData
uses gw.sampledata.tiny.TinySampleRatingData
uses gw.sampledata.tiny.TinySampleRegionData
uses gw.sampledata.tiny.TinyZoneData

uses gw.transaction.Transaction
uses nz.co.acc.rating.import.RateBookDataImporter_ACC
uses nz.co.acc.sampledata.AbstractSampleDataCollection_ACC
uses nz.co.acc.sampledata.AccountData_ACC
uses nz.co.acc.sampledata.ActivityPatternData_ACC
uses nz.co.acc.sampledata.BIC_CU_Data_ACC
uses nz.co.acc.sampledata.CommunityData_ACC
uses nz.co.acc.sampledata.ContactData_ACC
uses nz.co.acc.sampledata.EarningsMinMaxData_ACC
uses nz.co.acc.sampledata.InflationAdjustmentDataCollection_ACC
uses nz.co.acc.sampledata.InitialUsernamesData_ACC
uses nz.co.acc.sampledata.RatingData_ACC
uses nz.co.acc.sampledata.RegionData_ACC
uses nz.co.acc.sampledata.UWRuleData_ACC
uses nz.co.acc.sampledata.ZoneData_ACC

uses java.lang.Deprecated

/**
 * Main static helper for loading sample data.  This should
 * NEVER be invoked in production.
 *
 * See the PolicyCenter Sample Data functional spec for further information.
 */
@Export
class SampleData
{
  private construct() { }
  
  /**
   * Loads in the given data set.  Nothing bad happens if you load the same set in twice.
   * If you load in multiple sets, the result will be the union of the sets.
   */
  @Deprecated
  public static function loadSampleDataSet(dataSet : SampleDataSet) {
    var dataLoaded = Query.make(SecurityZone).compare(SecurityZone#Name, Relop.Equals, "Wellington Region").select().HasElements
    if(dataLoaded == false) {
      PCLoggerCategory.SAMPLE_DATA.info("Generating data : Time -> " + Date.CurrentDate.toTimeString())
    PCLoggerCategory.SAMPLE_DATA.info("Generating " + dataSet.DisplayName + " Sample Data Set...")
    if (dataSet.hasCategory(SampleDataSetCategory.TC_ADDITIVE)) {
      loadAdditiveSampleData(dataSet)
    } else {
      loadStandaloneSampleData(dataSet)
    }
    PCLoggerCategory.SAMPLE_DATA.info("Done generating " + dataSet.DisplayName + " Sample Data Set.")
      PCLoggerCategory.SAMPLE_DATA.info("Done generating : Time -> " + Date.CurrentDate.toTimeString())
    }
  }

  public static function loadUnitTestRateBookData() {
    var rateBookDataImporter = new RateBookDataImporter_ACC()
    PCLoggerCategory.SAMPLE_DATA.info("Loading unit test classification unit data : Time -> " + Date.CurrentDate.toTimeString())
    rateBookDataImporter.importUnitTestClassificationUnits()
    PCLoggerCategory.SAMPLE_DATA.info("Done loading unit test classification unit data : Time -> " + Date.CurrentDate.toTimeString())
    PCLoggerCategory.SAMPLE_DATA.info("Loading unit test business industry code data : Time -> " + Date.CurrentDate.toTimeString())
    rateBookDataImporter.importUnitTestBusinessIndustryCodes()
    PCLoggerCategory.SAMPLE_DATA.info("Done loading unit test business industry code data : Time -> " + Date.CurrentDate.toTimeString())
    PCLoggerCategory.SAMPLE_DATA.info("Loading unit test ratebook data : Time -> " + Date.CurrentDate.toTimeString())
    rateBookDataImporter.importUnitTestRatebook()
    PCLoggerCategory.SAMPLE_DATA.info("Done loading unit test ratebook data : Time -> " + Date.CurrentDate.toTimeString())
  }

  public static function loadUnitTestAccountData() {
    PCLoggerCategory.SAMPLE_DATA.info("Loading unit test account data : Time -> " + Date.CurrentDate.toTimeString())
    PCLoggerCategory.SAMPLE_DATA.info("Loading unit test account data...")
    PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Account Data ")
    loadCollection(new AccountData_ACC())
    PCLoggerCategory.SAMPLE_DATA.info("Done loading unit test account data")
    PCLoggerCategory.SAMPLE_DATA.info("Done loading unit test account data : Time -> " + Date.CurrentDate.toTimeString())
  }
  
  // load the data sets that build ontop of each other (e.g. Tiny->Small->Large)
  private static function loadAdditiveSampleData(dataSet : SampleDataSet) {
    // "Tiny" set
    if (dataSet.Priority >= SampleDataSet.TC_TINY.Priority) {
      loadCollection(new TinySampleRegionData())
      loadCollection(new TinySampleCommunityData())
      loadCollection(new TinySampleContactData())
      loadCollection(new TinyZoneData())
      loadCollection(new AllSampleFormData())
      if(gw.api.system.PCConfigParameters.RatingModuleOn()) {
        loadCollection(new TinySampleRatingData())
        Plugins.get(RateBookPreloadPlugin)?.update(RateBookEvent.CREATE)
      }
    }

    // Send Producer Codes, etc. from "Tiny" sample data to billing system
    flushMessageQueues()

    // "Small" set
    if (dataSet.Priority >= SampleDataSet.TC_SMALL.Priority) {
      loadCollection(new SmallSampleRegionData())
      loadCollection(new SmallSampleCommunityData())
      loadCollection(new SmallSampleReinsuranceData())
      loadCollection(new SmallSampleLookupData())
      loadCollection(new SmallSampleUWRuleData())
      loadCollection(new SmallSampleContactData())
      loadCollection(new SmallSampleAccountData())
      if(gw.api.system.PCConfigParameters.RatingModuleOn()) {
        loadCollection(new SmallSampleRatingData())
        Plugins.get(RateBookPreloadPlugin)?.update(RateBookEvent.CREATE)
      }
      loadCollection(new SmallSamplePolicyData())
    }
    
    // "Large" set
    if (dataSet.Priority >= SampleDataSet.TC_LARGE.Priority) {
      loadCollection(new LargeSampleAccountData())
      loadCollection(new LargeSamplePolicyData())
      if (PCArchivingUtil.isArchiveEnabled()) {
        loadCollection(new LargeSampleArchivedPoilcyData())
      } else {
        PCLoggerCategory.SAMPLE_DATA.info("Archiving is not enabled.  Skipping loading of Large Archived Policies Sample Data Set.")
      }
      loadCollection(new LargeSamplePurgedPolicyData())
      loadCollection(new LargeSamplePurgeablePolicyData())
    }
    
    // "Product x Job Status" set
    if (dataSet.Priority >= SampleDataSet.TC_PRODUCTXJOBSTATUS.Priority) {
      loadCollection(new ProductXJobStatusPolicyData())
    }
  }
  
  @Deprecated
  private static function loadStandaloneSampleData(dataSet : SampleDataSet) {
    /**
     * Begin: Modification for "ACC" standalone sample data set
     */
    if (dataSet == SampleDataSet.TC_ACC) {

      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Region ")
      loadCollection(new RegionData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Underwriter rule data ")
      loadCollection(new UWRuleData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Community data ")
      loadCollection(new CommunityData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Contact ")
      loadCollection(new ContactData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Zone data ")
      loadCollection(new ZoneData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Account Data ")
      loadCollection(new AccountData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: BIC CU Data ")
      loadCollection(new BIC_CU_Data_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Earnings ")
      loadCollection(new EarningsMinMaxData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Inflation Adjustment ")
      loadCollection(new InflationAdjustmentDataCollection_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Form data ")
      loadCollection(new AllSampleFormData())
      if(gw.api.system.PCConfigParameters.RatingModuleOn()) {
        PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Rating Data ")
        loadCollection(new RatingData_ACC())
      }

      PCLoggerCategory.SAMPLE_DATA.info("...Loading Sample Data -: Activity Patterns Data ")
      loadCollection(new ActivityPatternData_ACC())

//      createBusinessOwnersProduct()
      flushMessageQueues()
    }

    if (dataSet == SampleDataSet.TC_ACCUSERS) {
      PCLoggerCategory.SAMPLE_DATA.info("Loading Region Data...")
      loadCollection(new RegionData_ACC())
      PCLoggerCategory.SAMPLE_DATA.info("Loading Initial ACC User Data...")
      loadCollection(new InitialUsernamesData_ACC())
      flushMessageQueues()
    }


    /**
     * End: Modification for "ACC" standalone sample data set
     */
    else if (dataSet == SampleDataSet.TC_SEARCH) {
      loadAdditiveSampleData(TC_TINY) // we do depend on this one!
      flushMessageQueues() // send required data to billing system
      loadCollection(new SearchSampleContactData())
      loadCollection(new SearchSampleAccountData())
      loadCollection(new SearchSamplePolicyData())
    }
  }
  
  /**
   * Loads a given collection, using a service token to set the user as needed
   */
  internal static function loadCollection(dataCollection : AbstractSampleDataCollection) {
    var oldToken = PLDependenciesGateway.getCommonDependencies().getServiceToken()
    try {
      var user = PLDependenciesGateway.getUserFinder().findByCredentialName(dataCollection.RunAsUser)
      var token = PLDependenciesGateway.getServiceTokenManager().createAuthenticatedToken(user?.ID)
      PLDependenciesGateway.getCommonDependencies().setServiceToken(token)
      if (dataCollection.AlreadyLoaded) {
        PCLoggerCategory.SAMPLE_DATA.info("  - already loaded " + dataCollection.CollectionName)
      } else {
        PCLoggerCategory.SAMPLE_DATA.info("  - loading " + dataCollection.CollectionName + "...")
        dataCollection.load()
      }
    } catch (e : Throwable) {
      throw new RuntimeException("Failed to load " + dataCollection.CollectionName + " sample data", e)  
    } finally {
      PLDependenciesGateway.getCommonDependencies().setServiceToken(oldToken)
    }
  }

  internal static function createBusinessOwnersProduct() {
    Transaction.runWithNewBundleAsSystemUser_ACC(\bundle -> {
      new ProductLineBuilder().withProductCode("BusinessOwners").createBuilder().build()
    })
  }

  /**
   * Loads a given collection, using a service token to set the user as needed
   */
  internal static function loadCollection(dataCollection : AbstractSampleDataCollection_ACC) {
    var oldToken = PLDependenciesGateway.getCommonDependencies().getServiceToken()
    try {
      var user = PLDependenciesGateway.getUserFinder().findByCredentialName(dataCollection.RunAsUser)
      var token = PLDependenciesGateway.getServiceTokenManager().createAuthenticatedToken(user?.ID)
      PLDependenciesGateway.getCommonDependencies().setServiceToken(token)
      if (dataCollection.AlreadyLoaded) {
        PCLoggerCategory.SAMPLE_DATA.info("  - already loaded " + dataCollection.CollectionName)
      } else {
        PCLoggerCategory.SAMPLE_DATA.info("  - loading " + dataCollection.CollectionName + "...")
        dataCollection.load()
      }
    } catch (e : Throwable) {
      throw new RuntimeException("Failed to load " + dataCollection.CollectionName + " sample data", e)  
    } finally {
      PLDependenciesGateway.getCommonDependencies().setServiceToken(oldToken)
    }
  }

  public static function flushMessageQueues() {
    try {
      new QPlexorForwardingProxy().flushQPlexor() // send to billing system if necessary
    } catch(npe: NullPointerException) {
      // expected
    } catch(e: Exception) {
      PCLoggerCategory.SAMPLE_DATA.info("Exception occurred when trying to flush message queue after loading sample data: " + e.toString())
    }
  }
}

