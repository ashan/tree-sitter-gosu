package gw.acc.npg.wizard

class ProductInfoStepDTO {

  private var _packageName:String as PackageName
  private var _productDisplayName:String as ProductDisplayName
  private var _productCode:String as ProductCode
  private var _productAbbreviation:String as ProductAbbreviation
  private var _productEntitySuffix:String as ProductEntitySuffix
  private var _lineTitle:String as LineTitle
  private var _lineCode:String as LineCode
  private var _lineEntityName:String as LineEntityName
  private var _lineIncludeExclusions:boolean as LineIncludeExclusions
  private var _lineIncludeModifiers:boolean as LineIncludeModifiers
  private var _lineIncludeConditions:boolean as LineIncludeConditions
  private var _fields:Set<WizardFieldDTO> as Fields = new LinkedHashSet()

}