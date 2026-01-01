package nz.co.acc.plm.util

uses java.text.Normalizer

/**
 * Created by OurednM on 14/06/2018.
 */
enhancement StringEnhancement_ACC : String {

  function toOptional() : Optional<String> {

    if (this == null) {
      return Optional.empty()
    }

    if (this.isEmpty()) {
      return Optional.empty()
    } else {
      return Optional.of(this)
    }
  }

  /**
   * Escapes the unicode characters in a String using Java String rules.
   * <p>
   * E.g. "Māori" is returned as "M\u0101ori".
   *
   * @return
   */
  function escaped_ACC() : String {
    return org.apache.commons.lang3.StringEscapeUtils
        .escapeJava(this)
        .replaceAll("\\\\r", "\r")
        .replaceAll("\\\\n", "\n")
        .replaceAll("\\\\t", "\t")
  }

  function escapedJson_ACC() : String {
    return org.apache.commons.lang3.StringEscapeUtils
        .escapeJson(this)
  }

  function unescapedJson_ACC() : String {
    return org.apache.commons.lang3.StringEscapeUtils
        .unescapeJson(this)
  }

  /**
   * Unescapes any Java literals found in the String.
   * <p>
   * E.g. "M\u0101ori" is returned as "Māori".
   *
   * @return
   */
  function unescaped_ACC() : String {
    return org.apache.commons.lang3.StringEscapeUtils.unescapeJava(this)
  }

  /**
   * Returns an ASCII form of the string with accented characters converted.
   * E.g. "Mānny Aēsōp Sēbastiān" will be returned as "Manny Aesop Sebastian"
   *
   * @return
   */
  function flattenToAscii_ACC() : String {
    var sb = new StringBuilder(this.length())
    var normalized = Normalizer.normalize(this, Normalizer.Form.NFD)
    for (c in normalized.toCharArray()) {
      if (c <= '\u007F') {
        sb.append(c)
      }
    }
    return sb.toString()
  }

  function truncate(n : Integer) : String {
    if (this.length <= n) {
      return this
    } else {
      return this.substring(0, n)
    }
  }
}
