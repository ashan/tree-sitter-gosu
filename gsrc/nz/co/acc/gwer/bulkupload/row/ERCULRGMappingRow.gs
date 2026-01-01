package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERCULRGMappingRow extends AbstractXLSRow {
  public var levyApplicationYearNBR : Integer as LevyApplicationYear = null
  public var levyYearNBR : Integer as LevyYearNBR = null
  public var cuCode : String as CUCode = null
  public var cuDescription : String as CUDescription = null
  public var lrgCode : Integer as LRGCode = null
  public var active : Boolean as Active = null

  @Override
  function toString() : String  {
  return "ERCULRGMappingRow{" +
      "levyApplicationYearNBR='" + levyApplicationYearNBR + '\'' +
      ", levyYearNBR='" + levyYearNBR + '\'' +
      ", cuCode='" + cuCode + '\'' +
      ", cuDescription='" + cuDescription + '\'' +
      ", lrgCode='" + lrgCode + '\'' +
      ", active='" + active + '\'' +
      '}';
  }
}