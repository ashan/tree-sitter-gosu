package nz.co.acc.integration.ir.inbound.transformer


class IRLoadException extends RuntimeException {
  construct(msg : String) {
    super(msg)
  }
  
  construct(msg : String, e : Throwable) {
    super(msg, e)
  }
}