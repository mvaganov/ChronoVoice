function ById(id) {
	return document.getElementById(id);
}
function ChangeElementVisibility(e, isVisible = undefined) {
	if(isVisible === undefined) {
		isVisible = e.style.display=='inline' || e.style.display=='block' || !e.style.display;
		isVisible = !isVisible;
	}
	if(isVisible == 'inline'){
		e.style.display = 'inline';
	} else {
		e.style.display = isVisible ? 'block' : 'none';
	}
}
/**
@param {object} an element with a checkbox sibling (in the DOM)
@param {number} how many sibling checkboxes to trigger
*/
function ToggleSiblingCheckbox(element, count = 1) {
	var parent = element.parentElement;
	var nodes = parent.childNodes;
	for(var i = 0; i < nodes.length; i++) {
		if(nodes[i].type == 'checkbox' && (count > 0 || count < 0)) {
			nodes[i].click();
			count = count-1;
			if(count == 0) break;
		}
	}
}
/** @return a table of URL encoded parameters */
function GetUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}
/** assign a variable into the cookie */
function setCookie(cname, cvalue, exdays=10000000) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	var expires = "expires="+ d.toUTCString();
	cvalue = encodeURIComponent(cvalue);
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
/** @return cookie data from a variable in the cookie */
function getCookie(cname) {
	var name = cname + "=";
	var decodedCookie = decodeURIComponent(document.cookie);
	var ca = decodedCookie.split(';');
	var result = "";
	for(var i = 0; i <ca.length; i++) {
		var c = ca[i];
		while (c.charAt(0) == ' ') { c = c.substring(1); }
		if (c.indexOf(name) == 0) {
			result = c.substring(name.length, c.length);
			break;
		}
	}
	return result;
}
/**
@param filename {string} URL of file to get
@param cb {function(Error, string)} where to pass file data
*/
function String_FromFile(filename, cb) {
	if(!filename.startsWith("http") && !filename.startsWith("file")) {
		var path = window.location.href.substring(0, window.location.href.lastIndexOf("/")+1)
		filename = path+filename;
	}
	if(filename.startsWith("file")) {
		var errorString = "you can't get "+filename+" from your local computer. this is a security feature of JavaScript";
		console.error(errorString)
		cb(errorString)
		return;
	}
	var client = new XMLHttpRequest();
	client.open('GET', filename);
	client.onreadystatechange = function() {
		if(client.readyState == 4) {
			if (client.status == 200) {
				cb(null, client.responseText);
				return;
			} else {
				// console.log(client.status+" "+client.readyState);
				cb(client.status);
			}
		}
	}
	try{ client.send(); } catch(e) {
		console.log(client+" failed. "+e)
		cb(e);
		return;
	}
}

/**
@param datetime {Date}
@return {string} the given date converted to a string in "H:MM" format
*/
function Date_YYYYMMDDTHHMM(date) {
	return date.getFullYear() + "/" +
	("0" + (date.getMonth()+1)).slice(-2) + "/" +
	("0" + date.getDate()).slice(-2) + "." +
	("0" + date.getHours()).slice(-2) + ":" +
	("0" + date.getMinutes()).slice(-2);
}
