package nz.co.acc.plm.integration.ir.util

uses gw.entity.ITypeList
uses gw.entity.TypeKey

/**
 * All the methods on "TypeKey" to simplify the logic and make code more readable.
 *
 */
enhancement ACCTypeKeyEnhancement: TypeKey {

  /**
   * Function checks if all given typekey is mapped (as Category) to this typelist.
   * @param target Target typekey.
   * @return Check result as boolean.
   */
  public function isMappedToTypekey_ACC(target : TypeKey) : boolean {
    return  this.getAllMappedTypeKeys_ACC(target.IntrinsicType).contains(target)
  }

  /**
   * Get list of all typekeys mapped as category and with type matching to target typelist.
   * @param target Target typelist.
   * @return List of matching typekeys.
   */
  public function getAllMappedTypeKeys_ACC(target : ITypeList) : List<TypeKey>  {
    return this.Categories.where(\ cat -> cat.IntrinsicType ==  target).toList()
  }

}
