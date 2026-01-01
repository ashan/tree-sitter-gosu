package gw.acc.npg.validators

/**
 * Acceptor helps to delegate the logic to {@link gw.acc.npg.validators.IModelVisitor} by executing
 * the visit logic based on this acceptor type. When the associated visit method is called, its
 * implementation is chosen based on both:
 * 1. The dynamic type of the visitor.
 * 2. The dynamic type of this acceptor.
 *
 * @see https://en.wikipedia.org/wiki/Visitor_pattern
 */
interface IAcceptor {

  /**
   * Accept the visitor and call visit method of visitor.
   *
   * @param visitor
   */
  function accept(visitor: IModelVisitor)

}