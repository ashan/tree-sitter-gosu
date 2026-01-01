package nz.co.acc.gwer.uploadfiles

enum FileTypes_ACC {

  ActuarialParameters("Actuarial Parameters"),
  ManualModifers("Manual Modifiers")

  var _fileTypeName: String as readonly FileTypeName

  private construct(name : String) {
    this._fileTypeName = name
  }

}