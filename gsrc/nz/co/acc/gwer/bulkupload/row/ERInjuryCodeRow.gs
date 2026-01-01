package nz.co.acc.gwer.bulkupload.row

/**
 * Created by HamblyAl on 18/03/2019.
 */
class ERInjuryCodeRow extends AbstractXLSRow {
  public var injuryCode : String as InjuryCode = null
  public var codingSystem : String as CodingSystem = null
  public var injuryDescription : String as InjuryDescription = null
  public var injuryCategory : String as InjuryCategory = null

  @Override
  function toString() : String  {
  return "ERInjuryCodeRow{" +
      "injuryCode='" + injuryCode + '\'' +
      ", codingSystem='" + codingSystem + '\'' +
      ", injuryDescription='" + injuryDescription + '\'' +
      ", injuryCategory='" + injuryCategory + '\'' +
      '}';
  }
}