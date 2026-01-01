package nz.co.acc.er.runinfo

enum RunStatus_ACC {

  InProgress("In Progress"),
  Completed("Completed"),
  Failed("Failed")

  var _desc : String as readonly Desc

  private construct(d : String) {
    this._desc = d
  }

}