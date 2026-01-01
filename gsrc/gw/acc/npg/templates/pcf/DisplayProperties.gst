<% uses gw.acc.npg.model.ProductLine %>
<%@ params(productLine: ProductLine) %>

<%for(coverable in productLine.Coverables){%>
Web.Policy.${productLine.Abbrevation}.${coverable.EntityNameWithoutSuffix}.NamePlural = ${coverable.EntityDisplayName }s
Web.Policy.${productLine.Abbrevation}.${coverable.EntityNameWithoutSuffix}.ID = ID
Web.Policy.${productLine.Abbrevation}.${coverable.EntityNameWithoutSuffix}.CreatedBy = Created By
Web.Policy.${productLine.Abbrevation}.${coverable.EntityNameWithoutSuffix}.Details = Details
Web.Policy.${productLine.Abbrevation}.${coverable.EntityNameWithoutSuffix}.Basic = Basic Information
<%if(coverable.IsAutoNumbered){%>
Web.Policy.${productLine.Abbrevation}.${coverable.EntityNameWithoutSuffix}.AutoNumberFieldName = ${coverable.AutoNumberFieldName}
<%}%>
<%}%>
Web.Policy.${productLine.Abbrevation}.LineLevelCoverages = Line-level Coverages
Web.Policy.${productLine.Abbrevation}.Financials.Description = Description
Web.Policy.${productLine.Abbrevation}.Financials.Rate = Rate
Web.Policy.${productLine.Abbrevation}.Financials.Basis = Basis
Web.Policy.${productLine.Abbrevation}.Financials.TermAmount = Term Amount
Web.Policy.${productLine.Abbrevation}.Financials.EffDate = Eff. Date
Web.Policy.${productLine.Abbrevation}.Financials.ExpDate = Exp. Date
Web.Policy.${productLine.Abbrevation}.Financials.Proration = Proration
Web.Policy.${productLine.Abbrevation}.Financials.Amount = Amount
Web.Policy.${productLine.Abbrevation}.Financials.LineLevelPremiums = Line-level Premiums
<%for(coverable in productLine.Coverables){%>
<%if(coverable.ReferredFromCoverable!=null and coverable.ReferredFromCoverable typeis ProductLine){%>
Web.LineWizardMenu.${productLine.Abbrevation}.${coverable.CoverableScreenName} = ${coverable.EntityDisplayName }s
Web.PolicyFile.${productLine.Abbrevation}.${coverable.PolicyFileName} = ${coverable.EntityDisplayName }s
<%}%>
<%}%>