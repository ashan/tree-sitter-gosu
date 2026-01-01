package nz.co.acc.gwer.enhancement

uses gw.api.database.Relop

enhancement ERRequestEnhancement : ERRequest_ACC {
  function createAndAddTarget() : ERRequestTargetEntity_ACC {
    var target = new ERRequestTargetEntity_ACC()
    target.ERRequest = this
    return target
  }

  property get ReviewRates() : String {
    var run = gw.api.database.Query.make(ERRun_ACC).compare(ERRun_ACC#ERRequest, Relop.Equals, this).select().FirstResult

    if(run != null) {
      if(this.ERRequestType == ERRequestType_ACC.TC_TRL and
          this.ERRequestGroupType == ERRequestGroupType_ACC.TC_ALL and
          run.ERRunStatus == ERRunStatus_ACC.TC_COMPLETED) {
        return "Y"
      }
    }
    return "N"
  }

  function withdrawRequest() {
    var bundle = gw.transaction.Transaction.getCurrent()
    var nRequest = bundle.add(this)
    nRequest.ERRequestStatus = ERRequestStatus_ACC.TC_WDN
    bundle.commit()
  }

  property get ERRun() : ERRun_ACC{
    var run = gw.api.database.Query.make(ERRun_ACC)
        .compare(ERRun_ACC#ERRequest, Relop.Equals, this)
        .select().FirstResult
    return run
  }
}
