package nz.co.acc.common.integration.files.inbound.utils

/**
 * Created by Nithy on 13/03/2017.
 */
public enum InboundFileType {

  PAYMENT("PAYMENT"),
  WPREM("WPREM"),
  PRMSTMT("PRM"),
  INTSTMT("INTSTMT"),
  CRCARD("CRCARD"),
  XCPLEVY("XCPLEVY"),
  WPEL("WPEL"),
  NZP("NZP"),
  EC("EC"),
  DB("DB"),
  BC("BC"),
  GNA("GNA"),
  ACC_LEVYINVOICE("ACC-LEVYINVOICE-"),
  ACC_LETTERS("ACC-LETTER-"),
  DELETE_DOCUMENTS("DELETE-ACC-LE"),
  BANK_BRANCH("BANK_BRANCH")

  private final var value : String;
  private construct(msgIndex:String){
    this.value = msgIndex;
  }

  @Override
  public function toString() : String {
    return value;
  }

}