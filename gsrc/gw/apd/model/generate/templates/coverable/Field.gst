<%
uses org.apache.commons.lang.StringEscapeUtils
%>
<%@ params(field: APDAttribute) %>
<%var addScalable = field.Scalable%>
<%if(field.Type== APDFieldType.TC_BOOLEAN){%>
  <column
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    nullok="true"
    type="bit"/>
<%}else if(field.Type == APDFieldType.TC_DATE){%>
  <column
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    type="datetime"
    nullok="true"/>
<%}else if(field.Type == APDFieldType.TC_BIGDECIMAL){%>
  <column
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    nullok="true"
<%if(addScalable){%>
    scalable="true"
<%}%>
    type="decimal">
    <columnParam
      name="scale"
      value="2"/>
    <columnParam
      name="precision"
      value="14"/>
  </column>
<%}else if(field.Type == APDFieldType.TC_LOCATION){%>
  <foreignkey
    name="${field.Name}"
    fkentity="PolicyLocation"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    columnName="${field.Name}ID"
    exportable="true"
    nullok="true"/>
<%}else if(field.Type == APDFieldType.TC_INTEGER){%>
  <column
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    nullok="true"
<%if(addScalable){%>
    scalable="true"
<%}%>
    type="integer"/>
<%}else if(field.Type== APDFieldType.TC_MONEY){// need to think about what we really need when it comes to money%>
  <column
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    nullok="true"
<%if(addScalable){%>
    scalable="true"
<%}%>
    type="decimal">
    <columnParam
      name="scale"
      value="2"/>
    <columnParam
      name="precision"
      value="16"/>
  </column>
<%}else if(field.Type== APDFieldType.TC_PARTY){%>
<%if(field typeis APDField and field.Coverable typeis APDProductLine) {%>
  <edgeForeignKey
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    edgeTableName="${field.Name}Edge"
    extractable="true"
    fkentity="PolicyContactRole"
    name="${field.Name}"
    nullok="true"/>
<%} else {%>
  <foreignkey
    name="${field.Name}"
    fkentity="PolicyContactRole"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    columnName="${field.Name}ID"
    exportable="true"
    nullok="true"/>
<%}%>
<%}else if(field.Type== APDFieldType.TC_TYPEKEY){%>
  <typekey
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    typelist="${field.TypelistToUse}"
    nullok="true"/>
<%}else if(field.Type== APDFieldType.TC_VARCHAR){%>
  <column
    name="${field.Name}"
    desc="${StringEscapeUtils.escapeXml(field.Description)}"
    type="shorttext"
    nullok="true"/>
<%}%>