package nz.co.acc.common.util.db

/**
 * Database settings for a Microsoft SQL Server database.
 * <p>
 * Created by Kaushalya Samarasekera
 */
class MsSqlConnectionSettings extends AbstractDbConnectionSettings {

  construct() {
    super()
    this.setPort("1433")
  }

  override function getUrl(maskSensitiveData: boolean): String {
    return "jdbc:sqlserver://${this._host}:${this._port};DatabaseName=${this._dbname};User=${this._username};Password=${maskSensitiveData ? "*******" : this._password};${this._customParams}"
  }

  override function getTestQuery(): String {
    return "SELECT GETDATE() as db_date"
  }
}
