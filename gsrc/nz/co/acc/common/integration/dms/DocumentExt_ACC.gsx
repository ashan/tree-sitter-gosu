package nz.co.acc.common.integration.dms

uses gw.util.GosuStringUtil

/**
 * Enhances the Document entity for some ACC specifics.
 * Created by Nick on 24/03/2017.
 */
enhancement DocumentExt_ACC: Document {

  public function getAccID(): String {
    var accID: String = this.Account?.ACCID_ACC
    if (GosuStringUtil.isBlank(accID)) {
      accID = this.Policy?.Account?.ACCID_ACC
    }
    return accID
  }
}
