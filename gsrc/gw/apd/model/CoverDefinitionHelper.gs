package gw.apd.model

uses gw.apd.model.generate.templates.systables.ClaimCostCategory
uses gw.api.database.Query

uses java.nio.charset.StandardCharsets
uses java.nio.file.Files
uses java.nio.file.OpenOption
uses java.nio.file.Paths

@Export
class CoverDefinitionHelper {
  private static final var APPLICATION_PATH = System.getProperty("gw.devroot.dir")
  private static final var MODULES = "modules"
  private static final var CONFIGURATION = "configuration"
  private static final var CONFIG = "config"
  private static final var RESOURCES = "resources"
  private static final var SYSTABLES = "systables"

  private static final var SYSTABLESDIRECTORY = new String[]{MODULES, CONFIGURATION, CONFIG, RESOURCES, SYSTABLES}
  private static final var COSTCATEGORY_FILE = Paths.get(APPLICATION_PATH, SYSTABLESDIRECTORY.concat(new String[]{"apd_claimcostcategory.xml"}))

  var _costCategories : List<APDClaimCostCategory> as readonly ClaimCostCategories

  construct() {
    _costCategories = new ArrayList<APDClaimCostCategory>()
    for (cc in Query.make(APDClaimCostCategory).select().iterator()) {
      _costCategories.add(cc)
    }
  }

  function reBundleCostCategories() {
    final var bundle = gw.transaction.Transaction.getCurrent()
    var bundledCategories = new ArrayList<APDClaimCostCategory>()
    _costCategories.each(\cc -> bundledCategories.add(bundle.add(cc)))
    _costCategories = bundledCategories
  }

  function addToClaimCostCategories(costCategory : APDClaimCostCategory) {
    _costCategories.add(costCategory)
  }

  function removeFromClaimCostCategories(costCategory : APDClaimCostCategory) {
    _costCategories.remove(costCategory)
  }

  /**
   * Recreates the CostCode XML in the systables directory to match the entries persisted
   */
  function saveCostCategotySystemTableXML() {
    Files.write(COSTCATEGORY_FILE, ClaimCostCategory.renderToString(_costCategories.toTypedArray()).getBytes(StandardCharsets.UTF_8), new OpenOption[0])
  }

}