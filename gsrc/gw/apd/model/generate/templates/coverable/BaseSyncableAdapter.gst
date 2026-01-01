<%
uses gw.apd.model.generate.UsesStatementHandler
uses gw.api.productedition.field.SyncableFieldType
%>
<%@ params(basePackage : String, qualifiedName : String, entityFields: APDAttribute[]) %>
<%
var imports = new UsesStatementHandler()
imports.add("gw.api.domain.rules.BaseSyncableAdapter")
imports.add("gw.api.domain.rules.SyncableAdapter")

var fieldList = "{}"
if (entityFields.HasElements) {
  fieldList = "{\n" +
  entityFields.orderBy(\field -> field.Sequence).map(\field -> {
    var fieldType : String
    switch (field.Type) {
      case APDFieldType.TC_BOOLEAN:
        fieldType = SyncableFieldType.BOOLEAN.toString()
        break
      case APDFieldType.TC_INTEGER:
        fieldType = SyncableFieldType.INTEGER.toString()
        break
      case APDFieldType.TC_BIGDECIMAL:
        fieldType = SyncableFieldType.DECIMAL.toString()
        break
      case APDFieldType.TC_MONEY:
        fieldType = SyncableFieldType.MONEY.toString()
        break
      case APDFieldType.TC_VARCHAR:
        fieldType = SyncableFieldType.TEXT.toString()
        break
      case APDFieldType.TC_DATE:
        fieldType = SyncableFieldType.DATETIME.toString()
        break
      case APDFieldType.TC_TYPEKEY:
        fieldType = SyncableFieldType.TYPEKEY.toString()
        break
      case APDFieldType.TC_LOCATION:
        fieldType = SyncableFieldType.LOCATION.toString()
        break
      case APDFieldType.TC_PARTY:
        fieldType = SyncableFieldType.PARTY.toString()
        break
      default:
        throw "Unsupported field type: " + field.Type
    }
    imports.add("gw.api.locale.DisplayKey")
    imports.add("gw.api.productedition.field.${fieldType}SyncableField")
    return "        new ${fieldType}SyncableField(owner#" + field.Name + ".PropertyInfo, DisplayKey.get(\"entity.${qualifiedName}.${field.Name}\"))"
  }).join(",\n") + "\n    }"
}
%>
package ${basePackage}${imports}

@Export
class ${qualifiedName}SyncableAdapterBase extends BaseSyncableAdapter {

  final var _owningEntity : entity.${qualifiedName}

  construct(owner : entity.${qualifiedName}) {
    super(owner.PolicyLine, owner, ${fieldList})

    _owningEntity = owner
  }

