<%@params(
        type : String, owner : String, field : APDAttribute,
        labelDisplayKey : String, action : String, required : String,
        editableAttrValue : String, disablePostOnEnterAttrValue : String, onChangeAttrValue : String,
        argumentList : String
)%>
<%
var APDRulesHelper = "gw.web.rules.APDRulesHelper"

var valueType = ""
var filter = ""
var validationExpression = ""
var value = "${owner}.${field.Name}"
switch (field.Type) {
  case APDFieldType.TC_BIGDECIMAL:
    validationExpression = "${APDRulesHelper}.validateDecimalValueInRange(${argumentList}, ${value})"
    valueType = "java.math.BigDecimal"
    break
  case APDFieldType.TC_DATE:
    validationExpression = "${APDRulesHelper}.validateDateValueInRange(${argumentList}, ${value})"
    break
  case APDFieldType.TC_INTEGER:
    validationExpression = "${APDRulesHelper}.validateIntegerValueInRange(${argumentList}, ${value})"
    valueType = "java.lang.Integer"
    break
  case APDFieldType.TC_MONEY:
    validationExpression = "${APDRulesHelper}.validateMoneyValueInRange(${argumentList}, ${value})"
    valueType = "java.math.BigDecimal"
    break
  case APDFieldType.TC_TYPEKEY:
    valueType = "typekey.${field.TypelistToUse}"
    filter = "${APDRulesHelper}.filterTypeKeys&lt;${valueType}&gt;(${argumentList}, VALUES)"
    break
  case APDFieldType.TC_VARCHAR:
    valueType = "String"
    break
}
%>
            <InputSet>
              <Variable
                initialValue="${editableAttrValue}"
                name="isEditable"
                recalculateOnRefresh="true"
                type="Boolean"/>
              <Variable
                initialValue="${APDRulesHelper}.isVisible(${argumentList})"
                name="isVisible"
                recalculateOnRefresh="true"
                type="Boolean"/>
              <${type}Input
<%if (action != null) {%>
                action="${action}"
<%}%>
                editable="isEditable"
<%if (filter.HasContent) {%>
                filter="${filter}"
<%}%>
                id="${field.Name}"
                label="DisplayKey.get(&quot;${labelDisplayKey}&quot;)"
<%if (required != null) {%>
                required="${required}"
<%}%>
<%if (validationExpression.HasContent) {%>
                validationExpression="${validationExpression}"
<%}%>
                value="${value}"
<%if (valueType.HasContent) {%>
                valueType="${valueType}"
<%}%>
                visible="isVisible">
                <PostOnChange
                  disablePostOnEnter="${disablePostOnEnterAttrValue}"
                  onChange="${onChangeAttrValue}"/>
              </${type}Input>
            </InputSet>