package com.guidewire.pl.docexamples

/**
 * This servlet is acting as an external dms for testing and demoing purposes only.
 * Not intended for production, nor as the base for production implementation
 *
 */

uses gw.api.system.PLLoggerCategory
uses gw.document.DocumentsUtilBase
uses gw.document.documentdto.Document
uses gw.document.documentdto.Documents
uses gw.document.documentdto.anonymous.elements.DocumentList_Document
uses gw.pl.util.FileUtil
uses gw.servlet.Servlet
uses gw.servlet.ServletUtils
uses gw.util.Base64Util
uses gw.util.Pair
uses gw.util.StreamUtil

uses javax.servlet.ServletConfig
uses javax.servlet.ServletException
uses javax.servlet.http.HttpServlet
uses javax.servlet.http.HttpServletRequest
uses javax.servlet.http.HttpServletResponse
uses java.io.*
uses java.net.URLDecoder
uses java.net.URLEncoder
uses java.sql.Connection
uses java.sql.DriverManager
uses java.sql.PreparedStatement
uses java.util.concurrent.ConcurrentHashMap

@Export
@Servlet(\ path -> path.matches("/dms/(.*)"))
class DMSServlet extends HttpServlet {

  public static final var ATTRIB_DOC_PUBLICID_PARAM: String = "Document.PublicID"
  public static final var ATTRIB_JOIN_TABLE_TYPE: String = "JoinTable.Type"
  public static final var ATTRIB_JOIN_TABLE_PROPERTY: String = "JoinTable.JoinedProperty"
  public static final var ATTRIB_JOINED_PUBLICID: String = "Joined.PublicID"
  private var _purgeableUrl: String

  enum PropType { String, Date, Other }
  var _dbDriver = "org.h2.Driver"
  var _dbURL : String;
  var _dbUsername = "sa"
  var _dbPassword = "sa"
  var _urlRoot : String

