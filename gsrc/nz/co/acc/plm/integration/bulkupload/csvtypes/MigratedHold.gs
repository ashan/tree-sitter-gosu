package nz.co.acc.plm.integration.bulkupload.csvtypes

/**
 * Created by ChrisA on 1/10/2018.
 * ChrisA 02/10/2018 US12192 process Migrated Policy Holds
 */
class MigratedHold {

  public var accNumber: String as ACCNumber = null
  public var suffix: String as Suffix = null
  public var levyYear: Integer as LevyYear = null

  override function toString(): String {
    return "MigratedHold{" +
        "ACCNumber='" + ACCNumber + '\'' +
        ", Suffix='" + Suffix + '\'' +
        ", LevyYear='" + LevyYear + '\'' +
        '}'
  }
}