package edge.capabilities.quote.person.util
uses edge.capabilities.quote.person.dto.PersonDTO

/**
 * Helper class to accommodate Person entity differences between platforms.
 */
class PersonPlatformHelper {
  public static function fillBaseData(dto :  PersonDTO, person : Person) {
    dto.FirstNameKanji = person.FirstNameKanji
    dto.LastNameKanji = person.LastNameKanji
    dto.Particle = person.Particle
  }
  
  public static function updateBaseData(person : Person, dto : PersonDTO) {
    person.FirstNameKanji = dto.FirstNameKanji
    person.Particle = dto.Particle
    person.LastNameKanji = dto.LastNameKanji
  }
  
}
