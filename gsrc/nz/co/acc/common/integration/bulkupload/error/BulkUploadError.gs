package nz.co.acc.common.integration.bulkupload.error

uses gw.api.util.DisplayableException

/**
 * A final error reported to the Bulk Upload user
 *
 * Created by OurednM on 21/06/2018.
 */
class BulkUploadError extends DisplayableException {
  construct(message: String) {
    super(message)
  }

  construct(errors: List<Object>) {
    super(errors.join("\n"))
  }

}