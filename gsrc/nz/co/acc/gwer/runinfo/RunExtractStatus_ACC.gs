package nz.co.acc.gwer.runinfo

enum RunExtractStatus_ACC {

  Pending("Pending"),
  InProgress("In Progress"),
  Completed("Completed"),
  Failed("Failed"),
  Outdated("Outdated")

  var _desc : String as readonly Desc

  private construct(d : String) {
    this._desc = d
  }

}