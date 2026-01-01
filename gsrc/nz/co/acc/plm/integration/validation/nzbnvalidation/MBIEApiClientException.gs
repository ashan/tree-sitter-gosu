package nz.co.acc.plm.integration.validation.nzbnvalidation


class MBIEApiClientException extends RuntimeException {

  construct(msg : String) {
    super(msg)
  }

  construct(msg: String, error: Exception) {
    super(msg, error)
  }

  construct(e : Throwable) {
    super(e)
  }

}