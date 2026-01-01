package nz.co.acc.plm.integration.files.inbound.validation

uses nz.co.acc.common.integration.files.inbound.InboundFileValidator

uses java.nio.file.Path

/**
 * Created by Nick Mei on 01/09/2018.
 */
class MailhouseDocumentsValidation extends InboundFileValidator {

  construct(filePath: Path) {
    super(filePath)
  }

  override function hasErrors(): List<String> {
    this.addError(this.checkIfEmpty())
    return this._errors
  }

}