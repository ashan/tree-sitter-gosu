<%
uses gw.apd.model.generate.templates.TemplateComparators
%>
<%@ params(term : APDTerm, fieldNo : Integer) %>
<%if(term.Type== APDFieldType.TC_BOOLEAN){%>
    <GenericCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="BooleanTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false">
    </GenericCovTermPattern>
<%}else if(term.Type == APDFieldType.TC_DATE){%>
    <GenericCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="DateTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false">
    </GenericCovTermPattern>
<%}else if(term.Type == APDFieldType.TC_BIGDECIMAL){%>
    <DirectCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="DirectTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false"
      valueType="other">
    </DirectCovTermPattern>
<%}else if(term.Type == APDFieldType.TC_INTEGER){%>
    <DirectCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="DirectTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false"
      valueType="count">
    </DirectCovTermPattern>
<%}else if(term.Type== APDFieldType.TC_MONEY){%>
    <DirectCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="DirectTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false"
      valueType="money">
    </DirectCovTermPattern>
<%}else if(term.Type== APDFieldType.TC_TYPEKEY and term.DropDownType == APDDropDownType.TC_TYPELIST){%>
    <TypekeyCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="ChoiceTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false"
      typelist="${term.TypelistToUse}"/>
<%}else if(term.Type==APDFieldType.TC_TYPEKEY and term.DropDownType == APDDropDownType.TC_OPTION){%>
    <OptionCovTermPattern
      choiceLookupTableName="${term.OptionLookupTableName}"
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="ChoiceTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false"
      valueType="${term.DropdownColumns.first().ValueType.Code}">
        <AvailabilityScript/>
        <Options>
<%for(opt in term.Codes.sort(TemplateComparators.DropdownEntryOrdering)) for(ccy in opt.Currencies.sort(TemplateComparators.TypekeyOrdering)) {%>
          <CovTermOpt
            codeIdentifier="${term.CodeIdentifier}${opt.Code}${ccy.Code?:""}"
<%if(ccy.Code != null){%>
            currency="${ccy.Code}"
<%}%>
            optionCode="${opt.Code}${ccy.Code?:""}"
            priority="${opt.Sequence}"
            public-id="${opt.getChoicePublicId(ccy)}"
<%if(term.DropdownColumns.first().ValueType==CovTermModelVal.TC_MONEY
or term.DropdownColumns.first().ValueType==CovTermModelVal.TC_PERCENT
or term.DropdownColumns.first().ValueType==CovTermModelVal.TC_OTHER){%>
            value="${opt.Values.first().DecimalValue}"/>
<%}else{%>
            value="${opt.Values.first().IntegerValue}"/>
<%}%>
<%}%>
     </Options>
   </OptionCovTermPattern>
<%}else if(term.Type== APDFieldType.TC_TYPEKEY and term.DropDownType == APDDropDownType.TC_PACKAGE){%>
    <PackageCovTermPattern
      choiceLookupTableName="${term.PackageLookupTableName}"
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="ChoiceTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false">
      <AvailabilityScript/>
      <Packages>
<%for(pack in term.Codes.sort(TemplateComparators.DropdownEntryOrdering)) for(ccy in pack.Currencies.sort(TemplateComparators.TypekeyOrdering)){%>
        <CovTermPack
          codeIdentifier="${term.CodeIdentifier}${pack.Code}${ccy.Code?:""}"
<%if(ccy.Code != null){%>
          currency="${ccy.Code}"
<%}%>
          packageCode="${pack.Code}${ccy.Code?:""}"
          priority="${pack.Sequence}"
          public-id="${pack.getChoicePublicId(ccy)}">
          <PackageTerms>
<%for(val in pack.Values.sort(TemplateComparators.DropdownValueOrdering) index i){%>
<%if(val.HasValuePopulated){%>
            <PackageTerm
              codeIdentifier="${term.CodeIdentifier}${pack.Code}${ccy.Code?:""}${i}"
              public-id="${pack.getPackageTermPublicId(ccy, i)}"
<%if(val.DropdownColumn.ValueType==CovTermModelVal.TC_MONEY
or val.DropdownColumn.ValueType==CovTermModelVal.TC_PERCENT
or val.DropdownColumn.ValueType==CovTermModelVal.TC_OTHER){%>
              value="${val.DecimalValue}"
<%}else{%>
              value="${val.IntegerValue}"
<%}%>
              valueType="${val.DropdownColumn.ValueType.Code}"/>
<%}%>
<%}%>
            </PackageTerms>
          </CovTermPack>
<%}%>
     </Packages>
   </PackageCovTermPattern>
<%}else if(term.Type== APDFieldType.TC_VARCHAR){%>
    <GenericCovTermPattern
      codeIdentifier="${term.CodeIdentifier}"
      coverageColumn="StringTerm${fieldNo}"
      lookupTableName="${term.LookupTableName}"
      priority="${term.Sequence}"
      public-id="${term.ProductModelPublicId}"
      required="false">
    </GenericCovTermPattern>
<%}%>