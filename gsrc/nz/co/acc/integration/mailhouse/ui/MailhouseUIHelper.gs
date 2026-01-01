package nz.co.acc.integration.mailhouse.ui

class MailhouseUIHelper {

  static function skipRecord(record : MailhouseStaging_ACC) {
    if (canSkipRecord(record)) {
      gw.transaction.Transaction.runWithNewBundle(\bundle -> {
        record = bundle.add(record)
        record.setStatus(MailhouseStagingStatus_ACC.TC_SKIPPED)
      })
    }
  }

  static function canSkipRecord(record: MailhouseStaging_ACC) : boolean {
    return record.Status == MailhouseStagingStatus_ACC.TC_ERROR
  }

}