package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERLevyRiskGroupsRow extends AbstractXLSRow {
  public var levyYear : Integer as LevyYear = null
  public var code : Integer as Code = null
  public var description : String as Description = null

  @Override
  function toString() : String  {
  return "ERLevyRiskGroups{" +
      "levyYear='" + levyYear + '\'' +
      ", code='" + code + '\'' +
      ", description='" + description +
      '}';
  }
}