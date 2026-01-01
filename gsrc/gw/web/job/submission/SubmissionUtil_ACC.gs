package gw.web.job.submission

uses gw.api.locale.DisplayKey

/**
 * Created by eliyaz on 19/06/2017.
 */
class SubmissionUtil_ACC {

  public static function warningMsg(account: Account, productOffers : ProductSelection[]) : String {
    var msg : String = null

    productOffers?.eachWithIndex(\productOffer, index -> {
      if (!allowNewSubmission(account, productOffer)){
        if(index == 0){
          msg = productOffer.Product.Name
        }
        else{
          msg = (msg != null) ? msg + ", " : ""
          msg += productOffer.Product.Name
        }
      }
    })

    if(msg != null){
      return DisplayKey.get("Web.Submission.Products.PreventNewSubmission_ACC", msg, account.ACCID_ACC )
    }
    return msg
  }

  public static function allowNewSubmission(account: Account, productOffer : entity.ProductSelection) : boolean{
    switch(productOffer.Product.Name){
      case "Employer": return !account.Policies?.hasMatch(\policy -> policy.LatestPeriod?.EMPWPCLineExists and isAnySubmissionInQuoteOrBound(account, policy.Product.DisplayName))
      case "Shareholding Company" : return !account.Policies?.hasMatch(\policy -> policy.LatestPeriod?.CWPSLineExists and isAnySubmissionInQuoteOrBound(account, policy.Product.DisplayName))
      case "Individual" : return !account.Policies?.hasMatch(\policy -> policy.LatestPeriod?.INDCoPLineExists and isAnySubmissionInQuoteOrBound(account, policy.Product.DisplayName))
      default: return true
    }
  }

  public static function isAnySubmissionInQuoteOrBound(account : Account, product : String) : boolean{
    var submissions = Job.finder.findSelectedSubmissionsByAccount(account).toTypedArray()
    return submissions.hasMatch(\elt1 -> elt1.Policy.Product.DisplayName == product and
                      (elt1.DisplayStatus == "Quoted" || elt1.DisplayStatus == "Draft" || elt1.DisplayStatus == "New" || elt1.DisplayStatus == "Bound"))
  }

}