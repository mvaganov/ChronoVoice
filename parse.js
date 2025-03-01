/**
@param haystack {string} where to look for needles
@param needles {string[]} list of strings to look for
@param startIndex {number} where in the haystack to start looking
@param out_whichToken {number[]} essentially extra output, where element[0] is the index from needles of the needle that was found in haystack
@return where in the haystack the needle was found
*/
function String_FindTheNextOfThese(haystack, needles, startIndex, out_whichToken) {
	var startLetters = "";
	for(var i = 0; i < needles.length; ++i) startLetters += needles[i][0];
	var index = 0, cursor = 0;
	for(var i = startIndex; i < haystack.length; ++i) {
		cursor = 0;
		do {
			index = startLetters.indexOf(haystack[i], cursor);
			if(index >= 0 && index < haystack.length
			&& haystack.length >= i+needles[index].length
			&& (needles[index].length == 1
			|| haystack.indexOf(needles[index], i) == i)){
				if(out_whichToken != null) out_whichToken[0] = index;
				return i;
			}
			cursor = index+1;
		}while(index >= 0);
	}
	return -1;
}
/**
@param str {string}
@param delimiters {string[]} list of strings
@param includeDelimiters {boolean} if true, will append delimiters in the returned list
@return {string[]} a list of tokens, separated by delimiters, optionally including the delimiters
*/
function String_Split(str, delimiters, includeDelimiters = true) {
	var tokens = [];
	var start = 0, end = -1;
	var token = null;
	var whichDelimiter = -1;
	while(str && start < str.length) {
		whichDelimiter = [-1];
		end = String_FindTheNextOfThese(str, delimiters, start, whichDelimiter);
		if(end < 0) { end = str.length; }
		if(end-start > 0) {
			token = str.substring(start, end);
			tokens.push(token);
		}
		if(end >= 0 && end < str.length){
			end += delimiters[whichDelimiter[0]].length;
		}
		if(includeDelimiters && whichDelimiter[0] >= 0) { tokens.push(delimiters[whichDelimiter]); }
		start = end;
	}
	return tokens;
}
/**
@param str {string}
@param delimiters {string[]}
@return {string[]} a list of tokens, NOT including the delimiters
*/
function String_SplitClean(str, delimiters) { return String_Split(str, delimiters, false); }

/**
@param text {string}
@param findSubstrings {string[]}
@param replaceSubstrings {string[]}
@return {string} text after replacing elements from find with elements from replace
*/
function String_Replace(text, findSubstrings, replaceSubstrings) {
	if(!text)return text;
	var whichIgnorable = [-1];
	var cursor = 0, lastValidIndex = 0;
	var replaced = "";
	while(cursor >= 0) {
		var started = cursor;
		whichIgnorable[0] = -1;
		cursor = String_FindTheNextOfThese(text, findSubstrings, started, whichIgnorable);
		if(cursor >= 0) {
			if(lastValidIndex != cursor) {
				replaced += text.substring(lastValidIndex, cursor);
			}
			cursor += findSubstrings[whichIgnorable[0]].length;
			if(replaceSubstrings && replaceSubstrings.length > 0) {
				var replaceIndex = whichIgnorable[0];
				if(replaceIndex >= replaceSubstrings.length)
					replaceIndex %= replaceSubstrings.length;
				replaced += replaceSubstrings[replaceIndex];
			}
			lastValidIndex = cursor;
		} else {
			if(lastValidIndex == 0) { replaced = text; }
			else { replaced += text.substring(lastValidIndex, text.length); }
		}
	}
	return replaced;
}

/**
@param text {string}
@param substringsToRemove {string[]}
@return {string} a copy of 'text' after instances of the strings in 'substringsToRemove' were removed
*/
function String_Clean(text, substringsToRemove) { return String_Replace(text, substringsToRemove, []); }

/** return the given 'number' padded with leading zeros to be 'size' big*/
function String_NumberLead0s(number, size) {
	var s = number+"";
	while (s.length < size) s = "0" + s;
	return s;
}
/** @return if the given string starts with the given prefix */
function String_StartsWith (string, prefix) { return string.slice(0, prefix.length) == prefix; }

var Parse_TAB = ["\t"];
var Parse_QUOTES = ["\'","\""];
var Parse_SPACE = [" ","\t","\n","\r"];
var Parse_COLON = [":"];
var Parse_NEWLINECHARS = ["\n","\r"];
var Parse_TOKEN_BREAKING_CHARS = [" ",":",";","{","}","(",")","[","]",",","!","<",">"];

/** @class cursor that parses text. 
most of the Parse_ code could be refactored into this class, but in the interest of keeping this code more-portable, by being less-object-oriented, it hasn't been ObjectOrientified
*/
function Parse_Cursor(index=undefined, col=undefined, row=undefined) {
	if(!index){index=0;}if(!col){col=0;}if(!row){row=0;}
	this.index = index;
	this.row = row;
	this.col = col;
}
Parse_Cursor.prototype.toString = function() { return "@"+this.index+", "+this.row+":"+this.col; }

function __Parse_AdvanceCoordinateBy(letter, cursor) {
	cursor.col++; if(letter == '\n') { cursor.col = 0; cursor.row++; }
}
/**
@param text {string}
@param cursor {number[]} a number passed by reference in an array of size 1
*/
function Parse_SkipWhitepsace(text, cursor) {
	while(Parse_SPACE.indexOf(text[cursor.index]) >= 0 && cursor.index < text.length) {
		__Parse_AdvanceCoordinateBy(text[cursor.index], cursor);
		cursor.index++;
	}
}
/**
@param text {string}
@param cursor {number[]} a number passed by reference in an array of size 1
*/
function Parse_GetNextToken(text, cursor) {
	Parse_SkipWhitepsace(text, cursor);
	var token = null;
	var quoteType = Parse_QUOTES.indexOf(text[cursor.index]);
	__Parse_AdvanceCoordinateBy(text[cursor.index], cursor);
	if(quoteType >= 0) {
		var i = cursor.index+1;
		token = ""+Parse_QUOTES[quoteType];
		while(text[i] != Parse_QUOTES[quoteType]) {
			__Parse_AdvanceCoordinateBy(text[i], cursor);
			if(text[i] == '\\') {
				i++;
				c = text[i];
				var escapes = { 'a':'\a', 'b':'\b', 't':'\t', 'n':'\n', 'r':'\r' };
				if(escapes[c]) { c = escapes[c]; } else {
					c = "\""+c;
				}
				if(i == text.length) { --i; break; }
				__Parse_AdvanceCoordinateBy(text[i], cursor);
				token += c;
			} else {
				token += text[i];
			}
			i++;
		}
		token += text[i];
		i++; // step over that last quote
		// var oldtoken = token; token = text.substring(cursor.index, i); console.log(token+" "+oldtoken);
		cursor.index = i;
	} else {
		var i = cursor.index+1;
		if(Parse_TOKEN_BREAKING_CHARS.indexOf(text[cursor.index]) < 0) {
			while(Parse_TOKEN_BREAKING_CHARS.indexOf(text[i]) < 0
			&& i < text.length) {
				__Parse_AdvanceCoordinateBy(text[i], cursor);
				i++;
			}
		}
		token = text.substring(cursor.index, i);
		cursor.index = i;
	}
	return token;
}

/**
@param v {string}
@param stripQuotesOnly if true, will only remove quotes from beginning and end of token (if they exist)
@return a more JavaScript-y representation of the given value.
*/ 
function Parse_Value(v, stripQuotesOnly) {
	if(!stripQuotesOnly) {
		if(v == "null") { return null; }
		else if(!isNaN(v)) { return Number(v); }
	}
	var whichQuote = Parse_QUOTES.indexOf(v[0]);
	if(whichQuote >= 0 && whichQuote == Parse_QUOTES.indexOf(v[v.length-1])) {
		v = v.substring(1, v.length-1);
	}
	return v;
}
function Parse_ERROR(errcb, errorText){
	if(errcb) { errcb(errorText); return; }
	throw errorText;
}
/**
@param text {string}
@param obj {object}
@param cursor {number[]}
@return {object} the JavaScript object version of the text, which should be a stringified JavaScript Object
*/
function Parse_IntoObject(text, cursor, obj, errcb=undefined) {
	if(!obj) { obj = {}; }
	if(!cursor) {
		cursor = {index:0,row:0,col:0};
	}
	while(cursor.index < text.length) {
		var name = Parse_Value(Parse_GetNextToken(text, cursor), true);
		if(name == /*{*/"}") { break; }
		if(Parse_TOKEN_BREAKING_CHARS.indexOf(name) >= 0) {
			return Parse_ERROR(errcb, cursor+" name of field ("+name+")cannot be one of these: "+Parse_TOKEN_BREAKING_CHARS);
		}
		var value = Parse_GetNextToken(text, cursor);
		if(value != ":") { return Parse_ERROR(errcb, cursor+" Expected colon "+cursor); }
		value = Parse_Value(Parse_GetNextToken(text, cursor));
		if(value == /*{*/"}") { return Parse_ERROR(errcb, cursor+ " Expected value, not end of object"); }
		if(value == "["/*]*/) {
			value = obj[name];
			if(!value) value = [];
			value = Parse_IntoList(text, cursor, value, errcb);
		} else if (value == "{"/*"}"*/) {
			value = obj[name];
			if(!value) value = {};
			value = Parse_IntoObject(text, cursor, value, errcb);
		}
		obj[name] = value;
		var comma = Parse_GetNextToken(text, cursor);
		if(comma == /*{*/"}") { break; }
		else if(comma != ",") { return Parse_ERROR(errcb, cursor+" Found "+comma+". Expected comma or ending-curly-brace after \'"+name+"\':"+value); }
	}
	return obj;
}
/**
@param text {string}
@param obj {object}
@param cursor {number[]}
*/
function Parse_IntoList(text, cursor, list, errcb=undefined) {
	if(!list) { list = []; }
	if(!cursor) { cursor = [0,{row:0,col:0}]; }
	while(cursor.index < text.length) {
		value = Parse_Value(Parse_GetNextToken(text, cursor));
		if(value ==/*"["*/"]") { break; }
		if(value == /*{*/"}") { return Parse_ERROR(errcb, cursor+" Expected value, not end of object"); }
		if(value == "["/*]*/) {
			value = []; value = Parse_IntoList(text, cursor, value, errcb);
		} else if (value == "{"/*"}"*/) {
			value = {}; value = Parse_IntoObject(text, cursor, value, errcb);
		}
		list.push(value);
		var comma = Parse_GetNextToken(text, cursor);
		if(comma == /*[*/"]") { break; }
		else if(comma != ",") { return Parse_ERROR(errcb, cursor+" Expected comma or ending-curly-brace"); }
	}
	return list;
}
