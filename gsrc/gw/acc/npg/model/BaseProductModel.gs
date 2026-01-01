package gw.acc.npg.model

uses gw.acc.npg.validators.IValidatable

/**
 * Base product model include basic information shared by all other models
 */
abstract class BaseProductModel implements IValidatable {

  private var _abbr: String as Abbrevation
  private var _suffix: String as Suffix
  private var _lineDisplayName: String as LineDisplayName
  private var _lineEntityName: String as LineEntityName
  private var _packageName: String as PackageName

  /**
   * @return line abbreviation in lower case
   */
  property get AbbrevationLowerCase(): String {
    return Abbrevation.toLowerCase()
  }

  property get LineEntityNameWithoutSuffix(): String {
    return removeSuffix(LineEntityName)
  }

  /**
   * @return package name inwhich new lob code need to be created
   */
  property get LOBPackageName(): String {
    return "${PackageName}.${AbbrevationLowerCase}"
  }

  property get Suffix(): String {
    return _suffix?:""
  }

  /**
   * Remove {@literal _suffix} from given name
   *
   * @param name from which {@literal _suffix} needs to be removed
   * @return {@literal name} with {@literal _suffix} removed
   */
  public function removeSuffix(name: String): String {
    var startIndex = name.lastIndexOf(Suffix)
    return startIndex > 0 ? name.substring(0, startIndex) : name
  }
}