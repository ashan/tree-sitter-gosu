package edge.capabilities.gpa.search

uses java.util.ArrayList

class SolrPlugin implements IFTSPlugin{

  construct(){}

  override function performPolicySearch(searchParam: String): List<String> {

     var policies = new ArrayList<String>()

     if (gw.api.system.PLConfigParameters.FreeTextSearchEnabled.Value) {

       var policyCriteria = new gw.solr.SolrPolicySearchCriteria()
       policyCriteria.PolicyCriteria = searchParam
       policyCriteria.NameCriteria = searchParam

       policyCriteria.OfficialIdCriteria = searchParam
       policyCriteria.StreetCriteria = searchParam
       policyCriteria.CityCriteria = searchParam

       if (searchParam.Numeric) {
         policyCriteria.PhoneCriteria = searchParam
       }

       var policyResults = policyCriteria.performSearch()
       policyResults*.PolicyNumber.each(\number -> {

         if (number.NotBlank) {
             policies.add(number)
         }
       })
     }

    return policies
  }

  override function performAccountSearch(searchParam: String): List<String> {

    var accounts = new ArrayList<String>()

   /*if (gw.api.system.PLConfigParameters.FreeTextSearchEnabled.Value) {

     var criteria = new gw.solr.gwsea.GwseaSearchCriteria()

     criteria.Name = searchParam
     criteria.Address = searchParam
     criteria.Number = searchParam
     criteria.Phone = searchParam
     criteria.FEIN = searchParam
     criteria.PostalCode = searchParam
     criteria.State = searchParam

     var accountResults = gw.solr.gwsea.GwseaSearchPluginImpl.performFreeTextSearch(criteria)

     accountResults*.Number.each(\number -> {

       if (number.NotBlank) {
           accounts.add(number)
       }
     })
   } */

    return accounts
  }
}
