package edge.PlatformSupport

uses gw.pl.persistence.core.Bean

/**
 * Provides helper functions to work with entities.
 */
class Entities {
   public static function getEntityById(entityType : String, id: String): Object{
     final var objType = Type.forName("entity." + entityType) // Get the Type for the entity

     // Find the entity based on the publicID
     return gw.api.database.Query.make(objType as Type<Bean>).compare("PublicID", Equals, id).select().AtMostOneRow
   }
}
