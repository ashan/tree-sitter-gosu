package nz.co.acc.integration.ir.inbound.transformer

uses gw.util.GosuStringUtil
uses org.apache.commons.lang3.text.WordUtils

uses java.util.regex.Pattern


/**
 * Capitalizes names
 * <p>
 * Based on stored proc from BufferDB
 */
class ProperCaseUtil {
  final var _wordDelimiters : char[] = {' ', '-', '(', '.', ',', '&', '/', ':'}

  final var _hasUpperAndLowerCasePattern = Pattern.compile(".*[A-Z].*[a-z].*")
  final var _particlePattern = Pattern.compile("D['`’]|De|Del|Der|Di|Du|La|Le|Lo|Los|Von")
  final var _acronymsPattern = Pattern.compile("3d|Anz|Bnz|Bmw|Ibm|Ird|Nz|\\(Nz\\)|Pc|Po")

  // Matches D'Angelo, O'Brian
  final var _singleLetterPrefixPattern = Pattern.compile("^[DJKLMOR]['`’].*")

  // Matches 'aisake, 'ulukihelupe
  final var _samoanPrefixPattern = Pattern.compile("^'[aeiou]\\w+")

  // Matches names starting with "Mac" that are probably not Scottish.
  // Finds typical Polish or Italian Mac names ending in a,c,i,o,z or j
  final var _polishMacSurnamePattern = Pattern.compile("^Mac.*[aciozj]$")

  function capitalize(input : String, isCompany : boolean) : String {
    if (GosuStringUtil.isBlank(input)) {
      return input
    }
    if (isCompany and _hasUpperAndLowerCasePattern.matcher(input).matches()) {
      // don't modify company name if already capitalized
      return input
    }

    var capitalized = capitalize2(input, isCompany)

    if (isCompany) {
      return mapExceptionsForVanSurnameCompany(capitalized)
    } else {
      return mapExceptionsForVanSurnamePerson(capitalized)
    }
  }

  private function capitalize2(input : String, isCompany : boolean) : String {
    var sb = new StringBuilder(input.length)
    var tokens = new StringTokenizer(input, " -(.,&/:", true)
    var tokenIndex = 0
    while (tokens.hasMoreTokens()) {
      var token = tokens.nextToken()
      if (isDelimiter(token)) {
        sb.append(token)
      } else {
        sb.append(processToken(token, tokenIndex, isCompany))
      }
      tokenIndex += 1
    }
    return sb.toString()
  }

  private function isDelimiter(input : String) : boolean {
    if (input.length != 1) {
      return false
    }
    for (delimiter in _wordDelimiters) {
      if (input.charAt(0) == delimiter) {
        return true
      }
    }
    return false
  }

  private function processToken(token : String, tokenIndex : int, isCompany : Boolean) : String {
    token = WordUtils.capitalizeFully(token)
    
    if (tokenIndex == 0) {
      if (isCompany) {
        // Company must stay capitalized
        // ignore
      } else {
        // lowercase if matches particle
        // EXCEPT if it starts with "El"
        if (token != "El") {
          if (_particlePattern.matcher(token).matches()) {
            return token.toLowerCase()
          }
        }
      }
    } else {
      if (_particlePattern.matcher(token).matches()) {
        return token.toLowerCase()
      }
    }

    if (_acronymsPattern.matcher(token).matches()) {
      return token.toUpperCase()
    }
    if (_singleLetterPrefixPattern.matcher(token).matches()) {
      return token.substring(0, 2) + token.substring(2).capitalize()
    }
    if (_samoanPrefixPattern.matcher(token).matches()) {
      return "'" + token.substring(1).capitalize()
    }
    if (token.length <= 2) {
      return token
    }
    if (token.length >= 5 and token.startsWith("Mc")) {
      return "Mc" + token.substring(2).capitalize()
    }
    if (token.length >= 7 and token.startsWith("Mac")) {
      if (_polishMacSurnamePattern.matcher(token).matches()) {
        return mapExceptionsForMacSurname(token)
      } else {
        return mapExceptionsForMacSurname("Mac" + token.substring(3).capitalize())
      }
    }
    return token
  }

  private function mapExceptionsForMacSurname(word : String) : String {
    return word
        .replaceAll("\\bMack\\b", "Mack")
        .replaceAll("\\bMacHin", "Machin") // machine and variants
        .replaceAll("\\bMacAiran", "Macairan")
        .replaceAll("\\bMacHlin", "Machlin")
        .replaceAll("\\bMacKle", "Mackle")
        .replaceAll("\\bMacKlin", "Macklin")
        .replaceAll("\\bMacKie", "Mackie")
        .replaceAll("\\bMacKenzie", "Mackenzie")
        .replaceAll("\\bMacHado", "Machado") // Portuguese
        .replaceAll("\\bMacEvicius\\b", "Macevicius") // Lithuanian
        .replaceAll("\\bMacIulis", "Maciulis") // Lithuanian
        .replaceAll("\\bMacIas", "Macias") // Lithuanian
  }

  /**
   * Replace "Van de" with "van de"
   *
   * @param word
   * @return
   */
  private function mapExceptionsForVanSurnamePerson(word : String) : String {
    return word
        .replaceAll("\\bVan de\\b", "van de")
        .replaceAll("\\bVan der\\b", "van der")
  }

  /**
   * Replace "Van de" with "van de" EXCEPT when at the beginning of a company name
   *
   * @param word
   * @return
   */
  private function mapExceptionsForVanSurnameCompany(word : String) : String {
    return word
        .replaceAll("\\sVan de\\b", "van de")
        .replaceAll("\\sVan der\\b", "van der")
  }

}