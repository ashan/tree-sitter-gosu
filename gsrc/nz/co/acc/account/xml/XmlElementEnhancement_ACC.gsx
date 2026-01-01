package nz.co.acc.account.xml

uses gw.lang.reflect.IType
uses gw.lang.reflect.TypeSystem
uses gw.xml.XmlElement

enhancement XmlElementEnhancement_ACC: XmlElement {

  function getIntrinsicType_ACC(): IType {
    return TypeSystem.getByFullName(this.$TypeData.getName())
  }

}
