<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(coverable: APDCoverable, lang : LanguageType) %>
<%if (coverable["MenuLabel_" + lang.Code] != null) {%>Web.PolicyFile.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName} = ${coverable["MenuLabel_" + lang.Code]}
<%}%>
<%if (coverable["Name_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.Details = ${coverable["Name_" + lang.Code]}
<%}%>
<%if (coverable["MenuLabel_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}Screen = ${coverable["MenuLabel_" + lang.Code]}
<%}%>
<%if (coverable["Name_" + lang.Code] != null) {%>
<%if(coverable.AutoNumber) {%>
Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.Number = ${coverable["Name_" + lang.Code]} Number
<%}%>
<%if (coverable.HasSplittableFields) {%>
Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.SplitDetails = ${coverable["Name_" + lang.Code]} ({0} - {1})
<%}%>
<%}%>
<%for (field in coverable.Fields.sort(TemplateComparators.AttributeOrdering)) {%>
<%if (field["Label_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.${field.Name} = ${field["Label_" + lang.Code]}
<%}%>
<%}%>
<%for (category in coverable.ClauseCategories.sort(TemplateComparators.ClauseCategoryOrdering)) {%>
<%if (category["Name_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.${coverable.LinePrefix}${category.CodeIdentifier} = ${category["Name_"+ lang.Code]}
<%}%>
<%}%>
<%for (child in coverable.ChildCoverables.sort(TemplateComparators.CoverableOrdering)) {%>
<%if (child["MenuLabel_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.${child.LinePrefix}${child.TypeName} = ${child["MenuLabel_" + lang.Code]}
<%}%>
<%}%>
<%for (exposure in coverable.Exposures.sort(TemplateComparators.ExposureOrdering)) {%>
<%if (exposure["MenuLabel_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${coverable.TypeName}.${coverable.LinePrefix}${exposure.TypeName} = ${exposure["MenuLabel_" + lang.Code]}
<%}%>
<%for (field in exposure.Fields.sort(TemplateComparators.AttributeOrdering)) {%>
<%if (field["Label_" + lang.Code] != null) {%>Web.Policy.${coverable.LinePrefix}.${coverable.LinePrefix}${exposure.TypeName}.${field.Name} = ${field["Label_" + lang.Code]}
<%}%>
<%}%>
<%}%>