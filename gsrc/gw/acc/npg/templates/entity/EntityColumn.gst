<% uses gw.acc.npg.model.ColumnType%>
<% uses gw.acc.npg.model.Field %>
<%@ params( field: Field ) %>
<% if(field.Type == Array){%>
  <array
    name="${field.Name}"
    desc="${field.Description}"
    arrayentity="${field.ArrayEntity}"
<%if(field.Owner!=null){%>
    owner="${field.Owner}"
<%}%>
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    cascadeDelete="${field.CascadeDelete}"/>
<%}else if(field.Type== Bit){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="bit"/>
<%}else if(field.Type== Datetime){%>
  <column
    name="${field.Name}"
    type="datetime"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    desc="${field.Description}"/>
<%}else if(field.Type== Decimal){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="decimal">
    <columnParam
      name="scale"
      value="${field.Scale}"/>
    <columnParam
      name="precision"
      value="${field.Precision}"/>
  </column>
<%}else if(field.Type== Foreignkey){%>
  <foreignkey
    name="${field.Name}"
    fkentity="${field.FkEntity}"
<%if(field.Description!=null){%>
    desc="${field.Description}"
<%}%>
<%if(field.Exportable!=null){%>
    exportable="${field.Exportable}"
<%}%>
<%if(field.NonEffDated!=null){%>
    nonEffDated="${field.NonEffDated}"
<%}%>
    nullok="${field.NullOk}"/>
<%}else if(field.Type== Integer){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="integer"/>
<%}else if(field.Type== Longint){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="longint"/>
<%}else if(field.Type== Longtext){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="longtext"/>
<%}else if(field.Type== Mediumtext){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="mediumtext"/>
<%}else if(field.Type== Money){%>
  <monetaryamount
    name="${field.Name}"
    desc="${field.Description}"
    amountColumnName="${field.Name}"
    amountRange="nonnegative"
    nullok="${field.NullOk}"/>
<%}else if(field.Type== Nonnegativeinteger){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
    type="nonnegativeinteger"/>
<%}else if(field.Type== Percentage){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
    type="percentage"/>
<%}else if(field.Type== Positiveinteger){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="positiveinteger"/>
<%}else if(field.Type== Varchar){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="varchar">
    <columnParam
      name="size"
      value="${field.Size}"/>
  </column>
<%}else if(field.Type== Rate){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="rate"/>
<%}else if(field.Type== Shorttext){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    type="shorttext"/>
<%}else if(field.Type== Typekey){%>
  <typekey
    name="${field.Name}"
    desc="${field.Description}"
    nullok="${field.NullOk}"
    typelist="${field.Typelist}"/>
<%}else if(field.Type== PatternCode){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    type="patterncode"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    nullok="${field.NullOk}/>"
<%}else if(field.Type== AutoNumber){%>
  <column
    name="${field.Name}"
    desc="${field.Description}"
    type="integer"
<%if(field.GetterScriptability!=null){%>
    getterScriptability="${field.GetterScriptability.StringValue}"
<%}%>
<%if(field.SetterScriptability!=null){%>
    setterScriptability="${field.SetterScriptability.StringValue}"
<%}%>
    nullok="${field.NullOk}"/>
<%}%>