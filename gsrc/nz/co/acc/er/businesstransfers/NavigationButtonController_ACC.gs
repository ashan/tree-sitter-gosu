package nz.co.acc.er.businesstransfers

uses gw.api.locale.DisplayKey

uses java.io.Serializable

/**
 * Created by andy on 9/10/2017.
 */
class NavigationButtonController_ACC implements Serializable {

  public var _visible : boolean = true
  public var _enabled : boolean = true
  public var _label : String = ""


  public enum WizardButton {
    BackButton("b", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Back_ACC")),
    NextButton("n", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Next_ACC")),
    CancelButton("c", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Cancel_ACC")),
    SaveButton("u", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Save_ACC")),
    SubmitButton("s", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Submit_ACC")),
    WithdrawButton("w", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Withdraw_ACC")),
    EditButton("e", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Edit_ACC")),
    ApproveButton("a", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Approve_ACC")),
    DeclineButton("d", DisplayKey.get("Web.ExperienceRating.BusinessTransfers.WizardButtons.Decline_ACC"))

    private var _buttonValue : String as readonly ButtonValue
    private var _buttonLabel : String as readonly ButtonLabel

    private construct(value : String, buttonLabel : String) {
      this._buttonValue = value
      this._buttonLabel = buttonLabel
    }

    public function buttonValue() : String {
      return _buttonValue
    }

  }

  construct(button : WizardButton) {
    _label = button.ButtonLabel
  }

  function onClick() {
    print("*** ***  Button '" + _label + "' has been clicked.")
  }

  function isVisible() : boolean {
    return this._visible
  }
  function setVisible(visible : boolean) {
    this._visible = visible
  }

  function isEnabled() : boolean {
    return this._enabled
  }
  function setEnabled(enabled : boolean) {
    this._enabled = enabled
  }

  function getLabel() : String {
    return this._label
  }
  function setLabel(label : String) {
    this._label = label
  }
}