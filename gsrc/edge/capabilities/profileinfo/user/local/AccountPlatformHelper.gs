package edge.capabilities.profileinfo.user.local
uses edge.capabilities.profileinfo.user.dto.AccountSummaryDTO

class AccountPlatformHelper {
  public static function fillBaseProps(res : AccountSummaryDTO, contactPerson : Person) {
    res.FirstNameKanji = contactPerson.FirstNameKanji
    res.LastNameKanji = contactPerson.LastNameKanji
  }
}
