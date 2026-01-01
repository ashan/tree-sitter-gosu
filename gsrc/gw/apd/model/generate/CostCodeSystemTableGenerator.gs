package gw.apd.model.generate

uses gw.apd.model.generate.templates.systables.CostCode

/**
 * Cost Code system table configuration file generator
 */
@Export
class CostCodeSystemTableGenerator extends Generator {

  public static final var COSTCODE_FILENAME : String = "costcode_ext.xml"

  /**
   * Generates a system table configuration file with the given list of cost codes
   *
   * @param costCodes List of cost codes to be added into the configuration file
   */
  function generateConfig(costCodes : List<entity.CostCode>) {
    var file = createPath(SYSTABLESDIRECTORY.concat(new String[]{COSTCODE_FILENAME}))
    addOrReplaceFile(file, CostCode.renderToString(costCodes.toTypedArray()))
  }
}