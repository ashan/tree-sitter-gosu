package gw.acc.npg.exception

class HandlerException extends Exception {

  public construct() {
  }

  public construct(msg: String) {
    super(msg);
  }

  public construct(msg: String, cause: Throwable) {
    super(msg, cause);
  }

  public construct(msg: String, cause: HandlerException) {
    super(msg, cause);
  }

  public construct(msg: String, cause: Exception) {
    super(msg, cause);
  }


}