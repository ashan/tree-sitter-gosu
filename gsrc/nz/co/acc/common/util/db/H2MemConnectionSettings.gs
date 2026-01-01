package nz.co.acc.common.util.db

/**
 * Database settings for an H2 In-memory database.
 * <p>
 * Created by Kaushalya Samarasekera
 */
class H2MemConnectionSettings extends AbstractDbConnectionSettings {

  override function getUrl(maskSensitiveData: boolean): String {
    return "jdbc:h2:mem:${this._dbname}"
  }

  override function getTestQuery(): String {
    return "SELECT CURRENT_DATE() AS bufferdb_date"
  }
}
