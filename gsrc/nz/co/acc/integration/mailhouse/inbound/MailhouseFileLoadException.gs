package nz.co.acc.integration.mailhouse.inbound


class MailhouseFileLoadException extends RuntimeException {

  construct(msg: String) {
    super(msg)
  }

}