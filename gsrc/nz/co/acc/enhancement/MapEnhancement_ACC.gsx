package nz.co.acc.enhancement

uses com.google.gson.GsonBuilder

/**
 * Created by Mike Ourednik on 27/01/2020.
 */
enhancement MapEnhancement_ACC : Map {

  function toJson(prettyPrint : Boolean = false) : String {
    var gsonBuilder = new GsonBuilder()

    if (prettyPrint) {
      gsonBuilder.setPrettyPrinting()
    }

    return gsonBuilder
        .create()
        .toJson(this)
  }
}
