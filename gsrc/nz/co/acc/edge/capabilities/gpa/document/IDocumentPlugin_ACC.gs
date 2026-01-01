package nz.co.acc.edge.capabilities.gpa.document

uses edge.capabilities.gpa.document.IDocumentPlugin

/**
 * Created by nitesh.gautam on 11-Oct-17.
 */
interface IDocumentPlugin_ACC extends IDocumentPlugin {
  function toDTOArray(documents: Document[]): DocumentDTO_ACC[]
}