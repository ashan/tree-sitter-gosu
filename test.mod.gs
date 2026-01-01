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

uses foo.bar.ServletConfig
uses foo.bar.ServletException
uses foo.bar.http.HttpServlet
uses foo.bar.http.HttpServletRequest
uses foo.bar.http.HttpServletResponse
uses java.io.*
uses java.net.URLDecoder
