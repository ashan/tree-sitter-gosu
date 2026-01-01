package nz.co.acc.sampledata

uses gw.sampledata.AbstractSampleDataCollection
uses gw.transaction.Transaction

/**
 * A tiny set of Regions and SecurityZones, just enough for testing.
 */
@Export
class RegionData_ACC extends AbstractSampleDataCollection
{
  construct() { }

  /**
   * The name of this sample data collection, for logging and debugging
   */
  public override property get CollectionName() : String {
    return "ACC Regions"
  }
  
  /**
   * Checks the database, returning true if this set is already loaded (and thus doesn't need reloading)
   */
  public override property get AlreadyLoaded() : boolean {
    return securityZoneLoaded("HO UW")
  }
  
  /**
   * Loads the contents of this sample data set into the DB
   */
  public override function load() {
    Transaction.runWithNewBundle( \bundle -> {
    
      // ZONES
      loadSecurityZone(bundle, "HO UW", "HO Underwriting")
//      loadSecurityZone(bundle, "Eastern Region", "Eastern Region")
      loadSecurityZone(bundle, "Wellington Region", "Wellington Region")
      
      // REGIONS
      loadRegion(bundle, "Wellington Region", {
        loadRegionZone(bundle, "WG", "NZ", TC_CITY),
        loadRegionZone(bundle, "CH", "NZ", TC_CITY),
        loadRegionZone(bundle, "AK", "NZ", TC_CITY),
        loadRegionZone(bundle, "DU", "NZ", TC_CITY)
      })

      loadRegion(bundle, "Thorndon Branch - HI", {
          loadRegionZone(bundle, "WG", "NZ", TC_CITY)
      })
    })
  }
  
}
