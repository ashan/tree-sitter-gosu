package nz.co.acc.sampledata

/**
 * A small set of sample Accounts.
 */
@Export
class AccountData_ACC extends AbstractSampleDataCollection_ACC {

  construct() {
  }

  /**
   * The name of this sample data collection, for logging and debugging
   */
  public override property get CollectionName(): String {
    return "ACC Sample Account Data"
  }

  /**
   * Checks the database, returning true if this set is already loaded (and thus doesn't need reloading)
   */
  public override property get AlreadyLoaded(): boolean {
    return accountLoaded("C000456363")
  }

  /**
   * Loads the contents of this sample data set into the DB
   */
  public override function load() {

    var nzAddress = makeAddressBuilder("AttentionToOrCareOf", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "Address Line 1", "Address Line 2", "Address Line 3", "Wellington",
        null, "6140", Country.TC_NZ)
    var usAddress = makeAddressBuilder("AttentionToOrCareOf", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_PHYSICAL, null, "Address Line 1", "Address Line 2", "Address Line 3", "Oklahohoma",
        State.TC_FL, "1234", Country.TC_US)
    var ausAddress = makeAddressBuilder("AttentionToOrCareOf", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "Address Line 1", "Address Line 2", "Address Line 3", "Sydney",
        null, "2000", Country.TC_AU)


    loadPersonAccount(false, "049091850", "D87654321", "C000456363", "Personal", "TestData", "Person Testing House Ltd", "NZBN85859",
        makeAddressBuilder("Mt home", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null)

    loadCompanyAccount(false, false, "035901981", "D98765436", "S000212132", "Developers TestData Ltd", "Developers Testing House Ltd", "NZBN3221",
        makeAddressBuilder("My Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null)

    loadCompanyAccount(false, true, "049098576", "D98765437", "S000212133", "AEP TestData Ltd", "AEP Testing House Ltd", "NZBN3222",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151001", "12/01/2015"})

    loadCompanyAccount(false, true, null, "PP0120151010", "D98765440", "YLAEP001", "YLAEP001 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151010", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151011", "D98765441", "YLAEP002", "YLAEP002 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151011", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151012", "D98765442", "YLAEP003", "YLAEP003 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151012", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151013", "D98765443", "YLAEP004", "YLAEP004 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151013", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151014", "D98765444", "YLAEP005", "YLAEP005 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151014", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151015", "D98765445", "YLAEP006", "YLAEP006 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151015", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151016", "D98765446", "YLAEP007", "YLAEP007 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151016", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151017", "D98765447", "YLAEP008", "YLAEP008 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151017", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151018", "D98765448", "YLAEP009", "YLAEP009 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151018", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151019", "D98765449", "YLAEP0010", "YLAEP0010 AEP Testing House Ltd", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151019", "12/01/2015"})

    loadCompanyAccount(false, true, null, "PP0120151020", "D98765450", "JGAEP001", "JGAEP001", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151020", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151021", "D98765451", "JGAEP002", "JGAEP002", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151021", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151022", "D98765452", "JGAEP003", "JGAEP003", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151022", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151023", "D98765453", "JGAEP004", "JGAEP004", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151023", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151024", "D98765454", "JGAEP005", "JGAEP005", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151024", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151025", "D98765455", "JGAEP006", "JGAEP006", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151025", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151026", "D98765456", "JGAEP007", "JGAEP007", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151026", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151027", "D98765457", "JGAEP008", "JGAEP008", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151027", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151028", "D98765458", "JGAEP009", "JGAEP009", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151028", "12/01/2015"})
    loadCompanyAccount(false, true, null, "PP0120151029", "D98765459", "JGAEP0010", "JGAEP0010", "NZBN3223",
        makeAddressBuilder("AEP Buss", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "1 Short Street", "Mossburn", "Te Anau", "Southland",
            null, "1234", Country.TC_NZ), null, null, {"PP0120151029", "12/01/2015"})

    loadPersonAccount(false, "111222333", "D11223332", "C000456780", "IndivNZ001", "Lname", "TradingNameIndNZ", "NZBN1234", nzAddress, null, null)
    loadPersonAccount(false, "123123123", "D12341234", "C000456781", "IndivUS001", "Lname", "TradingNameIndUS", "NZBN2345", usAddress, null, null)

    // Bulk Upload Testing
    loadPersonAccount(false, "062805552", "D11223351", "C000456751", "IndivNZ000", "Lname", "TradingNameIndNZ00", "NZBN1251", nzAddress, null, null)
    loadPersonAccount(false, "069516130", "D11223352", "C000456752", "IndivNZ002", "Lname", "TradingNameIndNZ02", "NZBN1252", nzAddress, null, null)
    loadPersonAccount(false, "080280599", "D11223353", "C000456753", "IndivNZ003", "Lname", "TradingNameIndNZ03", "NZBN1253", nzAddress, null, null)
    loadPersonAccount(false, "043653571", "D11223354", "C000456754", "IndivNZ004", "Lname", "TradingNameIndNZ04", "NZBN1254", nzAddress, null, null)
    loadPersonAccount(false, "093499727", "D11223355", "C000456755", "IndivNZ005", "Lname", "TradingNameIndNZ05", "NZBN1255", nzAddress, null, null)
    loadPersonAccount(false, "055192960", "D11223356", "C000456756", "IndivNZ006", "Lname", "TradingNameIndNZ06", "NZBN1256", nzAddress, null, null)
    loadPersonAccount(false, "056010270", "D11223357", "C000456757", "IndivNZ007", "Lname", "TradingNameIndNZ07", "NZBN1257", nzAddress, null, null)
    loadPersonAccount(false, "006644449", "D11223358", "C000456758", "IndivNZ008", "Lname", "TradingNameIndNZ08", "NZBN1258", nzAddress, null, null)
    loadPersonAccount(false, "054844395", "D11223359", "C000456759", "IndivNZ009", "Lname", "TradingNameIndNZ09", "NZBN1259", nzAddress, null, null)
    loadPersonAccount(false, "069871720", "D11223360", "C000456760", "IndivNZ010", "Lname", "TradingNameIndNZ10", "NZBN1260", nzAddress, null, null)
    loadPersonAccount(false, "016542822", "D11223361", "C000456761", "IndivNZ011", "Lname", "TradingNameIndNZ11", "NZBN1261", nzAddress, null, null)
    loadPersonAccount(false, "095262759", "D11223362", "C000456762", "IndivNZ012", "Lname", "TradingNameIndNZ12", "NZBN1262", nzAddress, null, null)
    loadPersonAccount(false, "012157363", "D11223363", "C000456763", "IndivNZ013", "Lname", "TradingNameIndNZ13", "NZBN1263", nzAddress, null, null)
    loadPersonAccount(false, "013734887", "D11223364", "C000456764", "IndivNZ014", "Lname", "TradingNameIndNZ14", "NZBN1264", nzAddress, null, null)
    loadPersonAccount(false, "056571361", "D11223365", "C000456765", "IndivNZ015", "Lname", "TradingNameIndNZ15", "NZBN1265", nzAddress, null, null)
    loadPersonAccount(false, "031004063", "D11223366", "C000456766", "IndivNZ016", "Lname", "TradingNameIndNZ16", "NZBN1266", nzAddress, null, null)
    loadPersonAccount(false, "043271105", "D11223367", "C000456767", "IndivNZ017", "Lname", "TradingNameIndNZ17", "NZBN1267", nzAddress, null, null)
    loadPersonAccount(false, "057427531", "D11223368", "C000456768", "IndivNZ018", "Lname", "TradingNameIndNZ18", "NZBN1268", nzAddress, null, null)
    loadPersonAccount(false, "068170052", "D11223369", "C000456769", "IndivNZ019", "Lname", "TradingNameIndNZ19", "NZBN1269", nzAddress, null, null)
    loadPersonAccount(false, "053997511", "D11223370", "C000456770", "IndivNZ020", "Lname", "TradingNameIndNZ20", "NZBN1270", nzAddress, null, null)

    loadCompanyAccount(false, false, "456456456", "D33445663", "S000212121", "TradingCompNZ", "CompNZ", "NZBN3210", nzAddress, null, Date.Today)
    loadCompanyAccount(false, false, "567567567", "D33445333", "S000212122", "TradingCompUS", "CompUS", "NZBN3211", usAddress, null, null)

    loadCompanyAccount(false, true, "456456457", "D33445665", "S000212123", null, "AEPCompNZ", "NZBN3210", nzAddress, null, null, {"PP0120161001", "12/01/2016"})
    loadCompanyAccount(false, true, "567567568", "D33445337", "S000212124", null, "AEPCompUS", "NZBN3211", usAddress, null, null, {"PP0120161002", "12/01/2016"})

    // EMP WPC Account for sample data
    loadCompanyAccount(false, false, "057108568", "D33445690", "S000212190", "TradingSampleDataCompNZ", "SampleDataCompNZ", "NZBN3290", nzAddress, null, null)

    // CWPS Account for sample data
    loadCompanyAccount(false, false, "97652007", "A9457577", "S000212191", "CWPSSampleDataCompNZ", "CWPSSampleDataCompNZ", "NZBN3291", nzAddress, null, null)

    // Bulk Upload Testing
    loadCompanyAccount(false, false, "015366702", "D33445670", "S000212170", "TradingCompNZ000", "CompNZ000", "NZBN3270", nzAddress, null, null)
    loadCompanyAccount(false, false, "006376177", "D33445671", "S000212171", "TradingCompNZ001", "CompNZ001", "NZBN3271", nzAddress, null, null)
    loadCompanyAccount(false, false, "091798379", "D33445672", "S000212172", "TradingCompNZ002", "CompNZ002", "NZBN3272", nzAddress, null, null)
    loadCompanyAccount(false, false, "044833743", "D33445673", "S000212173", "TradingCompNZ003", "CompNZ003", "NZBN3273", nzAddress, null, null)
    loadCompanyAccount(false, false, "093348508", "D33445674", "S000212174", "TradingCompNZ004", "CompNZ004", "NZBN3274", nzAddress, null, null)
    loadCompanyAccount(false, false, "003827453", "D33445675", "S000212175", "TradingCompNZ005", "CompNZ005", "NZBN3275", nzAddress, null, null)
    loadCompanyAccount(false, false, "046013492", "D33445676", "S000212176", "TradingCompNZ006", "CompNZ006", "NZBN3276", nzAddress, null, null)
    loadCompanyAccount(false, false, "029476993", "D33445677", "S000212177", "TradingCompNZ007", "CompNZ007", "NZBN3277", nzAddress, null, null)
    loadCompanyAccount(false, false, "077176969", "D33445678", "S000212178", "TradingCompNZ008", "CompNZ008", "NZBN3278", nzAddress, null, null)
    loadCompanyAccount(false, false, "006229921", "D33445679", "S000212179", "TradingCompNZ009", "CompNZ009", "NZBN3279", nzAddress, null, null)
    loadCompanyAccount(false, false, "077184902", "D33445680", "S000212180", "TradingCompNZ010", "CompNZ010", "NZBN3280", nzAddress, null, null)
    loadCompanyAccount(false, false, "057036478", "D33445681", "S000212181", "TradingCompNZ011", "CompNZ011", "NZBN3281", nzAddress, null, null)
    loadCompanyAccount(false, false, "084147303", "D33445682", "S000212182", "TradingCompNZ012", "CompNZ012", "NZBN3282", nzAddress, null, null)
    loadCompanyAccount(false, false, "038389068", "D33445683", "S000212183", "TradingCompNZ013", "CompNZ013", "NZBN3283", nzAddress, null, null)
    loadCompanyAccount(false, false, "031036615", "D33445684", "S000212184", "TradingCompNZ014", "CompNZ014", "NZBN3284", nzAddress, null, null)
    loadCompanyAccount(false, false, "032740197", "D33445685", "S000212185", "TradingCompNZ015", "CompNZ015", "NZBN3285", nzAddress, null, null)

    loadCompanyAccount(false, false, "555456456", "D33565663", "S000212125", "Scrooge McDuck Trading Co", "Scrooge McDuck Company", "NZBN951951", nzAddress, null, null)
    loadCompanyAccount(false, false, "666567567", "D33675333", "S000212126", "Tweety Bird and Company", "Tweety Bird and Company Ltd", "NZBN8528", usAddress, null, null)

    loadPersonAccount(false, "444222333", "D11243332", "C000456782", "Donald", "Duck", "Donald Duck Ltd", "NZBN4445", makeAddressBuilder("Manager", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "321 Quack Street", "Duckville", "Ducktown", "Wellington",
        null, "1234", Country.TC_NZ), null, null)
    loadPersonAccount(false, "444555333", "D11234332", "C000456783", "Mickey", "Mouse", "Mickey Mouse Ltd", "NZBN85858", makeAddressBuilder("Mickey Mouse", AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "321 Cheese Lane", "Cheesevile", "Cheesetown", "Cheesecity",
        null, "1234", Country.TC_NZ), null, null)

    // Added Accounts for SHE Testing
    loadPersonAccount(false, "007794495", "D11243433", "C000456882", "Hairy", "McLary", "Hairy McLary Ltd", "NZBN4545", nzAddress, null, null)
    loadPersonAccount(false, "012328990", "D11243434", "C000456883", "Scarface", "Claw", "Hairy McLary Ltd", "NZBN4546", nzAddress, null, Date.Today)
    loadPersonAccount(false, "013654034", "D11243435", "C000456884", "Ron", "Weasley", "Bitzer Maloney Ltd", "NZBN4547", nzAddress, null, null)
    loadPersonAccount(false, "015423560", "D11243436", "C000456885", "Zachary ", "Quack", "Bitzer Maloney Ltd", "NZBN4548", nzAddress, null, null)
    loadPersonAccount(false, "015492465", "D11243437", "C000456886", "Captain", "America", "Bitzer Maloney Ltd", "NZBN4549", nzAddress, null, null)
    loadPersonAccount(false, "022072293", "D11243438", "C000456887", "Harry", "Potter", "Bitzer Maloney Ltd", "NZBN4550", nzAddress, null, null)
    loadPersonAccount(false, "025509846", "D11243439", "C000456889", "Doraemon", "Cat", "Bitzer Maloney Ltd", "NZBN4551", nzAddress, null, null)
    loadPersonAccount(false, "026498317", "D11243440", "C000456890", "Draco", "Malfoy", "Bitzer Maloney Ltd", "NZBN4552", nzAddress, null, null)
    loadPersonAccount(false, "034926859", "D11243441", "C000456891", "Elmer", "Fudd", "Bitzer Maloney Ltd", "NZBN4553", nzAddress, null, null)
    loadPersonAccount(false, "037530573", "D11243442", "C000456892", "Tony", "Stark", "Bitzer Maloney Ltd", "NZBN4554", nzAddress, null, null)
    loadPersonAccount(false, "044504561", "D11243443", "C000456893", "Huey", "Duck", "Bitzer Maloney Ltd", "NZBN4555", nzAddress, null, null)
    loadPersonAccount(false, "044047055", "D11243444", "C000456894", "Ginny", "Weasley", "Bitzer Maloney Ltd", "NZBN4556", nzAddress, null, null)
    loadPersonAccount(false, "065030950", "D11243445", "C000456895", "Bitzer", "Maloney", "Bitzer Maloney Ltd", "NZBN4557", nzAddress, null, null)
    loadPersonAccount(false, "070407531", "D11243446", "C000456896", "Hercules", "Morse", "Hairy McLary Ltd", "NZBN4558", ausAddress, null, null)
    loadPersonAccount(false, "075050127", "D11243447", "C000456897", "Daisy", "Duck", "Bitzer Maloney Ltd", "NZBN4559", ausAddress, null, null)
    loadPersonAccount(false, "075309724", "D11243448", "C000456898", "Daffy", "Duck", "Bitzer Maloney Ltd", "NZBN4560", ausAddress, null, null)
    loadPersonAccount(false, "078901357", "D11243449", "C000456899", "Neville", "Longbottom", "Bitzer Maloney Ltd", "NZBN4561", ausAddress, null, null)
    loadPersonAccount(false, "079993646", "D11243450", "C000456900", "Slinky", "Malinki", "Bitzer Maloney Ltd", "NZBN4562", ausAddress, null, null)
    loadPersonAccount(false, "080503326", "D11243451", "C000456901", "Bottomley", "Potts", "Bitzer Maloney Ltd", "NZBN4563", nzAddress, null, null)
    loadPersonAccount(false, "083614773", "D11243452", "C000456902", "Muffin", "McLay", "Hairy McLary Ltd", "NZBN4564", nzAddress, null, null)
    loadPersonAccount(false, "088735420", "D11243453", "C000456903", "Lord", "Voldemort", "Bitzer Maloney Ltd", "NZBN4565", nzAddress, null, null)
    loadPersonAccount(false, "090393294", "D11243454", "C000456904", "Hermione", "Granger", "Bitzer Maloney Ltd", "NZBN4566", nzAddress, null, null)
    loadPersonAccount(false, "096074808", "D11243455", "C000456905", "Schnitzel", "von Krumm", "Bitzer Maloney Ltd", "NZBN4567", nzAddress, null, null)
    loadPersonAccount(false, "068065593", "D11243456", "C000456906", "Dewey", "Duck", "Bitzer Maloney Ltd", "NZBN4568", nzAddress, null, null)

    //Accounts with Migrated Flag True
    loadPersonAccount(true, "999222333", "D99223332", "C000456784", "MigratedPerson", "Lname", "TradingNameIndNZ", "NZBN9234", nzAddress.withMigratedStatus(true), null, null)
    loadCompanyAccount(true, false, "999456456", "D99445663", "S000312120", "MigratedTradingCompNZ", "MigratedCompNZ", "NZBN9210", nzAddress.withMigratedStatus(true), null, null)
    loadCompanyAccount(true, true, "999456457", "D99445665", "S000312121", null, "MigratedAEPCompNZ", "NZBN9211", nzAddress.withMigratedStatus(true), null, null, {"PP0120121012", "12/01/2012"})


    //Load a person with a null or empty IRD number (US2998) - the supplied ACC number matches the IRD number in the 'trading name' for testing purposes
    loadPersonAccount(false, null, "Q4636515", "C100456906", "IRD", "NULL", "IRD number should be: 41442182", "NZBN4568", nzAddress, null, null)
    loadPersonAccount(false, "", "R9472266", "C100456907", "IRD", "EMPTY", "IRD number should be: 96499027", "NZBN4569", nzAddress, null, null)
    loadPersonAccount(false, null, null, "C100456908", "IRD", "ACCNULL", "IRD number can  be: 95679595", "NZBN4569", nzAddress, null, null)

    //Load account with an IRD address type set US3095
    loadPersonAccount(false, "020572469", "B2919506", "C100556906", "IRD", "Address", "IRD Address Set", "NZBN4568",
        nzAddress.withAddressPolicyType(AddressPolicyType_ACC.TC_CPCPX).withAddressType(AddressType.TC_IRACC) as AddressBuilder_ACC, null, null)
    loadCompanyAccount(false, false, "20159766", "X2218302", "C100556907", "IRD Address", "IRD Address", "NZBN9211",
        nzAddress.withAddressPolicyType(AddressPolicyType_ACC.TC_WPS).withAddressType(AddressType.TC_IRACC) as AddressBuilder_ACC, null, null)

    // Technical Account for the Outbound framework (required for the generation of activities in case of failed batch process)
    loadCompanyAccount(false, false, null, "TechAccount001", "TechAccount001", "ACC Juno Outbound Framework Technical Account", "ACC Juno Outbound Framework Technical Account", null,
        makeAddressBuilder(null, AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "123 Immaginary Street", null, null, "Wellington", null, "1234", Country.TC_NZ), null, null)

    // Technical Account for the Inbound framework (required for the generation of activities in case of failed GNA matching process)
    loadCompanyAccount(false, false, null, "TechAccount002", "TechAccount002", "ACC Juno Inbound Framework Technical Account", "ACC Juno Inbound Framework Technical Account", null,
        makeAddressBuilder(null, AddressType.TC_PREFERREDACC, AddressLocationType_ACC.TC_POSTAL, null, "123 Immaginary Street", null, null, "Wellington", null, "1234", Country.TC_NZ), null, null)
  }
}