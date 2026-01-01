package nz.co.acc.plm.util

/**
 * Created by Franklin Manubag on 20/8/2020.
 */
class ListUtil {
  public static function cmp( ll : List, l2 : List ) : boolean {
    // make a copy of the list so the original list is not changed, and remove() is supported
    var cp = new ArrayList( ll )
    for ( o in l2 ) {
      if ( !cp.remove( o ) ) {
        return false;
      }
    }
    return cp.isEmpty();
  }
}