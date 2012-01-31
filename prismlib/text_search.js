/***********************************************************
* TEXT SEARCH CLASS
*	Designed & developed by Dima Svirid, 2009	
*	Class: text_search.js
* Extends: system.js
************************************************************/
$WI.Method.TextSearch = {	
	Submit: function(frm) {		
		if(frm.tagName.toLowerCase() != 'form')
			var frm = this._getForm(frm);
		if(!frm) return;
		if(frm["no-phrase-input"].value.length > 0)
      frm["no-phrase"].value = quote(frm["no-phrase-input"].value)
    else if(frm["no-phrase"].value.length > 0)
      frm["no-phrase"].value = ''
    
		doMakeQuery(frm.query);

		frm.q.value = frm.query.value;
	},
	AdvancedSearch: function(frm) {		
		if(frm.tagName.toLowerCase() != 'form')
			var frm = this._getForm(frm);
		if(!frm) return;
		frm.advanced.value = 'true';					
		frm.submit();
	},
	BasicSearch: function(frm) {		
		if(frm.tagName.toLowerCase() != 'form')
			var frm = this._getForm(frm);
		if(!frm) return;
		frm.advanced.value = 'false';					
		frm.submit();
	},
	DidYouMean: function(frm, word) {
		if(frm.tagName.toLowerCase() != 'form')
			var frm = this._getForm(frm);
		if(!frm) return;
		frm.q.value = word;					
		frm.submit();
	},
	_getForm: function(el) {
		return $WI.DOM._getParent(el, {byTagName: 'form'});
	}
};
$WI.TextSearch = $WI.Method.TextSearch;

/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Lucene Search Query Constructor
// Author:  Kelvin Tan  (kelvint at apache.org)
// Version: $Id$

// Change this according to what you use to name the field modifiers in your form.
// e.g. with the search field "name", the form element of its modifier 
// will be "name<modifierSuffix>"
var modifierSuffix = 'Mod';

// If not a field-specific search
// e.g. with the arbitary form element 'foobar', its modifier will be 
// <noFieldPrefix>foobarModifier and its form element 
// will be <noFieldPrefix>foobar
var noFieldPrefix = 'no-';

// Do you wish the query to be displayed as an alert box?
var debug = false;

// Do you wish the function to submit the form upon query construction?
var submitForm = false;

// prefix modifier for boolean AND queries
var AND_MODIFIER = '+';

// prefix modifier for boolean NOT queries
var NOT_MODIFIER = '-';

// prefix modifier for boolean OR queries
var OR_MODIFIER  = ' ';

var NO_MODIFIER = 0;

// default modifier for terms
var DEFAULT_TERM_MODIFIER = AND_MODIFIER;

// default modifier for groups of terms (denoted by parantheses)
var DEFAULT_GROUP_MODIFIER = AND_MODIFIER;

// used to delimit multiple values from checkboxes and select lists
var VALUE_DELIMITER = ' ';

// Constructs the query
// @param query Form field to represent the constructed query to be submitted
// @param debug Turn on debugging?
function doMakeQuery( query, dbg )
{
  if(typeof(dbg) != "undefined")
    debug = dbg;
    
  var frm = query.form;
  var formElements = frm.elements;
  query.value = '';
  
  // keep track of the fields we've examined
  var dict = new Array();
  
  for(var i=0; i<formElements.length; i++)
  {
    var element = formElements[i];
    var elementName = element.name;
    if(elementName != "" && !contains(dict, elementName))
    {
      dict[dict.length] = elementName;
      
      // ensure we get the whole group (of checkboxes, radio, etc), if applicable
      var elementValue = getFieldValue(frm[element.name]);
      if(elementValue.length > 0)
      {
        var subElement = frm[elementName + modifierSuffix];
        if(typeof(subElement) != "undefined") // found a field/fieldModifier pair
        {
          var termMod, groupMod;
          var modifier = getFieldValue(subElement);
          // modifier field is in the form <termModifier>|<groupModifier>
          if(modifier.indexOf('|') > -1)
          {
            var idx = modifier.indexOf('|');
            termMod = modifier.substring(0, idx);
            if(termMod == '') termMod = DEFAULT_TERM_MODIFIER;
            groupMod = modifier.substring(idx + 1);
            if(groupMod == '') groupMod = DEFAULT_GROUP_MODIFIER;
          }
          else
          {
            termMod = modifier;
            if(termMod == '') termMod = DEFAULT_TERM_MODIFIER;
            groupMod = DEFAULT_GROUP_MODIFIER;
          }
          appendTerms(query, termMod, elementValue, elementName, groupMod);
        }
      }
    }
  }

  if(debug) {alert('Query:' + query.value);}
  
  if(submitForm)
  {
    frm.submit();
  }
  else
  {
    return query;
  }
}

// Constructs a Google-like query (all terms are ANDed)
// @param query Form field to represent the constructed query to be submitted
// @return Submits the form if submitOnConstruction=true, else returns the query param
function doANDTerms(query)
{
  var value = query.value;
  query.value = "";
  appendTerms(query, AND_MODIFIER,  value);
  if(submitForm)
  {
    frm.submit();
  }
  else
  {
    return query;
  }
}

function buildTerms(termModifier, fieldValue)
{
  fieldValue = trim(fieldValue);
  var splitStr = fieldValue.split(" ");
  fieldValue = '';
  var inQuotes = false;
  for(var i=0;i<splitStr.length;i++)
  {
    if(splitStr[i].length > 0)
    {
      if(!inQuotes)
      {
        fieldValue = fieldValue + termModifier + splitStr[i] + ' ';
      }
      else
      { 
        fieldValue = fieldValue + splitStr[i] + ' ';
      }      
      if(splitStr[i].indexOf('"') > -1) inQuotes = !inQuotes
    }
  }
  fieldValue = trim(fieldValue);  
  return fieldValue;
}

// Appends terms to a query. 
// @param query Form field of query
// @param termModifier Term modifier
// @param value Value to be appended. Tokenized by spaces, 
//    and termModifier will be applied to each token.
// @param fieldName Name of search field. Omit if not a field-specific query.
// @param groupModifier Modifier applied to each group of terms.
// @return query form field
function appendTerms(query, termModifier, value, fieldName, groupModifier)
{
  if(typeof(groupModifier) == "undefined")
    groupModifier = DEFAULT_GROUP_MODIFIER;
  
  value = buildTerms(termModifier, value);
  
  // not a field-specific search
  if(fieldName == null || fieldName.indexOf(noFieldPrefix) != -1 || fieldName.length == 0)
  {
    if(groupModifier == NO_MODIFIER)
    {
      if(query.value.length == 0)
      {
        query.value = value;
      }
      else
      {
        query.value = query.value + ' ' + value;
      }  
    }
    else
    { 
      if(query.value.length == 0)
      {
        query.value = groupModifier + '(' + value + ')';
      }
      else
      {
        query.value = query.value + ' ' + groupModifier + '(' + value + ')';
      }  
    }
  }
  else
  {
  	if(groupModifier == NO_MODIFIER) groupModifier = ''
    if(query.value.length == 0)
    {
      query.value = groupModifier + fieldName + ':(' + value + ')';
    }
    else
    {
      query.value = query.value + ' ' + groupModifier +fieldName + ':(' + value + ')';
    }  
  }
  query.value = trim(query.value)
  return query;
}

// Obtain the value of a form field.
// @param field Form field
// @return Array of values, or string value depending on field type, 
//    or empty string if field param is undefined or null
function getFieldValue(field)
{
  if(field == null || typeof(field) == "undefined")
    return "";
  if(typeof(field) != "undefined" && typeof(field[0]) != "undefined" && field[0].type=="checkbox")
    return getCheckedValues(field);
  if(typeof(field) != "undefined" && typeof(field[0]) != "undefined" && field[0].type=="radio")
    return getRadioValue(field);
  if(typeof(field) != "undefined" && field.type.match("select*")) 
    return getSelectedValues(field);
  if(typeof(field) != "undefined")
    return field.value;
}

function getRadioValue(radio)
{
  for(var i=0; i<radio.length; i++)
  {
    if(radio[i].checked)
      return radio[i].value;
  }
}

function getCheckedValues(checkbox)
{
  var r = new Array();
  for(var i = 0; i < checkbox.length; i++)
  {
    if(checkbox[i].checked)
      r[r.length] = checkbox[i].value;
  }
  return r.join(VALUE_DELIMITER);
}

function getSelectedValues (select) {
  var r = new Array();
  for (var i = 0; i < select.options.length; i++)
    if (select.options[i].selected)
    {
      r[r.length] = select.options[i].value;
    }
  return r.join(VALUE_DELIMITER);
}

function quote(value)
{
  return "\"" + trim(value) + "\"";
}

function contains(array, s)
{
  for(var i=0; i<array.length; i++)
  {
    if(s == array[i])
      return true;
  }
  return false;
}

function trim(inputString) {
   if (typeof inputString != "string") { return inputString; }
   
   var temp = inputString;
   
   // Replace whitespace with a single space
   var pattern = /\s+/ig;
   temp = temp.replace(pattern, " ");
  
   // Trim 
   pattern = /^(\s*)([\w\W]*)(\b\s*$)/;
   if (pattern.test(temp)) { temp = temp.replace(pattern, "$2"); }
   // run it another time through for words which don't end with a character or a digit
   pattern = /^(\s*)([\w\W]*)(\s*$)/;
   if (pattern.test(temp)) { temp = temp.replace(pattern, "$2"); }
   return temp; // Return the trimmed string back to the user
}


/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Author: Kelvin Tan  (kelvint at apache.org)
// JavaScript Lucene Query Validator
// Version: $Id$
// Tested: IE 6.0.2800 and Mozilla Firebird 0.7

// Special characters are + - && || ! ( ) { } [ ] ^ " ~ * ? : \
// Special words are (case-sensitive) AND NOT OR

// Makes wildcard queries case-insensitive if true.
// Refer to http://www.mail-archive.com/lucene-user@jakarta.apache.org/msg00646.html
var wildcardCaseInsensitive = true;

// Mutator method for wildcardCaseInsensitive.
// @param Should wildcard queries be case-insensitive?
function setWildcardCaseInsensitive(bool)
{
  wildcardCaseInsensitive = bool;
}

// Should the user be prompted with an alert box if validation fails?
var alertUser = true;

function setAlertUser(bool)
{
  alertUser = bool;
}

// validates a lucene query.
// @param Form field that contains the query
function doCheckLuceneQuery(queryField)
{
  return doCheckLuceneQueryValue(queryField.value)
}

// validates a lucene query.
// @param query string
function doCheckLuceneQueryValue(query)
{
  if(query != null && query.length > 0)
  {
    query = removeEscapes(query);
    
    // check for allowed characters
    if(!checkAllowedCharacters(query)) return false;
    
    // check * is used properly
    if(!checkAsterisk(query)) return false;
    
    // check for && usage
    if(!checkAmpersands(query)) return false;
    
    // check ^ is used properly 
    if(!checkCaret(query)) return false;
    
    // check ~ is used properly
    if(!checkSquiggle(query)) return false;
    
    // check ! is used properly 
    if(!checkExclamationMark(query)) return false;
    
    // check question marks are used properly
    if(!checkQuestionMark(query)) return false;
    
    // check parentheses are used properly
    if(!checkParentheses(query)) return false;
    
    // check '+' and '-' are used properly      
    if(!checkPlusMinus(query)) return false;
    
    // check AND, OR and NOT are used properly
    if(!checkANDORNOT(query)) return false;    
    
    // check that quote marks are closed
    if(!checkQuotes(query)) return false;
    
    // check ':' is used properly
    if(!checkColon(query)) return false;
    
    if(wildcardCaseInsensitive)
    {
      if(query.indexOf("*") != -1)
      {
        var i = query.indexOf(':');
        if(i == -1)
        {
          query.value = query.toLowerCase();
        }
        else // found a wildcard field search
        {
          query.value = query.substring(0, i) + query.substring(i).toLowerCase();
        }
      }
    }
    return true;
  }
}

// remove the escape character and the character immediately following it
function removeEscapes(query)
{
  return query.replace(/\\./g, "");
}

function checkAllowedCharacters(query)
{
  matches = query.match(/[^a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@#\/$%'= ]/);
  if(matches != null && matches.length > 0)
  {
    if(alertUser) alert("Invalid search query! The allowed characters are a-z A-Z 0-9.  _ + - : () \" & * ? | ! {} [ ] ^ ~ \\ @ = # % $ ' /. Please try again.")
    return false;
  }
  return true;
}

function checkAsterisk(query)
{
  matches = query.match(/^[\*]*$|[\s]\*|^\*[^\s]/);
  if(matches != null)
  {
    if(alertUser) alert("Invalid search query! The wildcard (*) character must be preceded by at least one alphabet or number. Please try again.")
    return false;
  }
  return true;
}

function checkAmpersands(query)
{
  // NB: doesn't handle term1 && term2 && term3 in Firebird 0.7
  matches = query.match(/[&]{2}/);
  if(matches != null && matches.length > 0)
  {
    matches = query.match(/^([a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@#\/$%'=]+( && )?[a-zA-Z0-9_+\-:.()\"*?|!{}\[\]\^~\\@#\/$%'=]+[ ]*)+$/); // note missing & in pattern
    if(matches == null)
    {
      if(alertUser) alert("Invalid search query! Queries containing the special characters && must be in the form: term1 && term2. Please try again.")
      return false;
    }
  }
  return true;
}

function checkCaret(query)
{
  //matches = query.match(/^[^\^]*$|^([a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\~\\@#\/]+(\^[\d]+)?[ ]*)+$/); // note missing ^ in pattern
  matches = query.match(/[^\\]\^([^\s]*[^0-9.]+)|[^\\]\^$/);
  if(matches != null)
  {
    if(alertUser) alert("Invalid search query! The caret (^) character must be preceded by alphanumeric characters and followed by numbers. Please try again.")
    return false;
  }
  return true;
}

function checkSquiggle(query)
{
  //matches = query.match(/^[^~]*$|^([a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^\\@#\/]+(~[\d.]+|[^\\]\\~)?[ ]*)+$/); // note missing ~ in pattern
  matches = query.match(/[^\\]~[^\s]*[^0-9\s]+/);
  if(matches != null)
  {
    if(alertUser) alert("Invalid search query! The tilde (~) character must be preceded by alphanumeric characters and followed by numbers. Please try again.")
    return false;
  }    
  return true;
}

function checkExclamationMark(query)
{
  // foo! is not a query, but !foo is. hmmmm...
  // NB: doesn't handle term1 ! term2 ! term3 or term1 !term2
  matches = query.match(/^[^!]*$|^([a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@#\/$%'=]+( ! )?[a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@#\/$%'=]+[ ]*)+$/);
  if(matches == null || matches.length == 0)
  {
    if(alertUser) alert("Invalid search query! Queries containing the special character ! must be in the form: term1 ! term2. Please try again.")
    return false;
  }
  
  
  return true;
}

function checkQuestionMark(query)
{
  matches = query.match(/^(\?)|([^a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@#\/$%'=]\?+)/);
  if(matches != null && matches.length > 0)
  {
      if(alertUser) alert("Invalid search query! The question mark (?) character must be preceded by at least one alphabet or number. Please try again.")
    return false;
  }
  return true;
}

function checkParentheses(query)
{
  var hasLeft = false;
  var hasRight = false;
  matchLeft = query.match(/[(]/g);
  if(matchLeft != null) hasLeft = true
  matchRight = query.match(/[)]/g);
  if(matchRight != null) hasRight = true;
  
  if(hasLeft || hasRight)
  {
    if(hasLeft && !hasRight || hasRight && !hasLeft)
    {
        if(alertUser) alert("Invalid search query! Parentheses must be closed. Please try again.")
        return false;
    }
    else
    {
      var number = matchLeft.length + matchRight.length;
      if((number % 2) > 0 || matchLeft.length != matchRight.length)
      {
        if(alertUser) alert("Invalid search query! Parentheses must be closed. Please try again.")
        return false;
      }    
    }
    matches = query.match(/\(\)/);
    if(matches != null)
    {
      if(alertUser) alert("Invalid search query! Parentheses must contain at least one character. Please try again.")
      return false;    
    }
  }  
  return true;    
}

function checkPlusMinus(query)
{
  matches = query.match(/^[^\n+\-]*$|^([+-]?[a-zA-Z0-9_:.()\"*?&|!{}\[\]\^~\\@#\/$%'=]+[ ]?)+$/);
  if(matches == null || matches.length == 0)
  {
    if(alertUser) alert("Invalid search query! '+' and '-' modifiers must be followed by at least one alphabet or number. Please try again.")
    return false;
  }
  return true;
}

function checkANDORNOT(query)
{
  matches = query.match(/AND|OR|NOT/);
  if(matches != null && matches.length > 0)
  {
    matches = query.match(/^([a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@\/#$%'=]+\s*((AND )|(OR )|(AND NOT )|(NOT ))?[a-zA-Z0-9_+\-:.()\"*?&|!{}\[\]\^~\\@\/#$%'=]+[ ]*)+$/);       
    if(matches == null || matches.length == 0)
    {
      if(alertUser) alert("Invalid search query!  Queries containing AND/OR/NOT must be in the form: term1 AND|OR|NOT|AND NOT term2 Please try again.")
      return false;
    }
    
    // its difficult to distinguish AND/OR/... from the usual [a-zA-Z] because they're...words!
    matches = query.match(/^((AND )|(OR )|(AND NOT )|(NOT ))|((AND)|(OR)|(AND NOT )|(NOT))[ ]*$/)
    if(matches != null && matches.length > 0)
    {
      if(alertUser) alert("Invalid search query!  Queries containing AND/OR/NOT must be in the form: term1 AND|OR|NOT|AND NOT term2 Please try again.")
      return false;
    }
  }
  return true;
}

function checkQuotes(query)
{
  matches = query.match(/\"/g);
  if(matches != null && matches.length > 0)
  {
    var number = matches.length;
    if((number % 2) > 0)
    {
      if(alertUser) alert("Invalid search query! Please close all quote (\") marks.");
      return false;
    }
    matches = query.match(/""/);
    if(matches != null)
    {
      if(alertUser) alert("Invalid search query! Quotes must contain at least one character. Please try again.")
      return false;    
    }    
  }
  return true;
}

function checkColon(query)
{
  matches = query.match(/[^\\\s]:[\s]|[^\\\s]:$|[\s][^\\]?:|^[^\\\s]?:/);
  if(matches != null)
  {
    if(alertUser) alert("Invalid search query! Field declarations (:) must be preceded by at least one alphabet or number and followed by at least one alphabet or number. Please try again.")
    return false;
  }
  return true;
}
