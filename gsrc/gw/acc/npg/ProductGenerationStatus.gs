package gw.acc.npg

uses gw.api.locale.DisplayKey

public enum ProductGenerationStatus {
  INITIALISE(""),
  FAILURE(DisplayKey.get("Accelerator.NPG.Web.Import.GenerationFailureMessage")),
  SUCCESS(DisplayKey.get("Accelerator.NPG.Web.Import.GenerationCompleteMessage")),
  PROGRESS(DisplayKey.get("Accelerator.NPG.Web.Import.GenerationInProgressMessage"))

  var _message: String as Message

  private construct(message: String) {
    _message = message
  }
}