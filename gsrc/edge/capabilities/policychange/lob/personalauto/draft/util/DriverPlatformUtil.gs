package edge.capabilities.policychange.lob.personalauto.draft.util
uses edge.capabilities.policychange.lob.personalauto.draft.dto.DriverDTO

class DriverPlatformUtil {

  static function toDtoKanjiFields(dto:DriverDTO,driver:PolicyDriver) {
    dto.Person.FirstNameKanji = driver.FirstNameKanji
    dto.Person.LastNameKanji = driver.LastNameKanji
    
  }
  
  static function toDtoPersonKanjiFields(dto:DriverDTO,person:Person) {
    dto.Person.FirstNameKanji = person.FirstNameKanji
    dto.Person.LastNameKanji = person.LastNameKanji
  }

  static function fillKanjiFields(driver:PolicyDriver, dto:DriverDTO) {
    driver.FirstNameKanji = dto.Person.FirstNameKanji
    driver.LastNameKanji = dto.Person.LastNameKanji
  }
}
