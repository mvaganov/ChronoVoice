var timeOffset = {d:0, h:0, m:0, s:0};
function reloadDateOffset() {
	var sv = getCookie("timeoffset.s");
	var mv = getCookie("timeoffset.m");
	var hv = getCookie("timeoffset.h");
	var dv = getCookie("timeoffset.d");
	if(sv) ById("timeoffset.s").value = sv;
	if(mv) ById("timeoffset.m").value = mv;
	if(hv) ById("timeoffset.h").value = hv;
	if(dv) ById("timeoffset.d").value = dv;
	setDateOffset(false);
}
function setDateOffset(alsoRestartAlarms = true){
	var s = ById("timeoffset.s");
	var m = ById("timeoffset.m");
	var h = ById("timeoffset.h");
	var d = ById("timeoffset.d");
	setCookie("timeoffset.s", s.value);
	setCookie("timeoffset.m", m.value);
	setCookie("timeoffset.h", h.value);
	setCookie("timeoffset.d", d.value);
	if(s.value) timeOffset.s = Number(s.value);
	if(m.value) timeOffset.m = Number(m.value);
	if(h.value) timeOffset.h = Number(h.value);
	if(d.value) timeOffset.d = Number(d.value);
	if(alsoRestartAlarms) RestartAlarms();
}
function AddDate(date, timeOffset) {
	var d = new Date(date);
	if(timeOffset.d) { d.setDate(d.getDate()+timeOffset.d); }
	if(timeOffset.h) { d.setHours(d.getHours()+timeOffset.h); }
	if(timeOffset.m) { d.setMinutes(d.getMinutes()+timeOffset.m); }
	if(timeOffset.s) { d.setSeconds(d.getSeconds()+timeOffset.s); }
	return d;
}
/** @return {Date} a new Date object, used for getting current time. can be modified for testing */
function newDate() {
	var d = new Date();
	return AddDate(d, timeOffset);
}

/**
@param date {Date} if null, uses newDate(), which is basically 'Date.now()'
@return {number} amount of seconds
*/
function Seconds(date) {
	if(!date) { date = newDate(); }
	return date.getTime()/1000;
}

function TimePrint(seconds) {
	var out = "";
	var d = parseInt(seconds/86400);
	if(d > 0) { out += d+" day"; if(d>1){out+="s"} out+=" ";}
	seconds -= d*86400;
	var h = parseInt(seconds/3600);
	if(h > 0) { out += h+" hr"; if(h>1){out+="s"} out+=" ";}
	seconds -= h*3600;
	var m = parseInt(seconds/60);
	if(m > 0) { out += m+" min"; if(m>1){out+="s"} out+=" ";}
	seconds -= m*60;
	var s = parseInt(seconds);
	if(s > 0) { out += s+" sec"; if(s>1){out+="s"} out+=" ";}
	return out;
}

/**
@param dateA {Date}
@param dateB {Date}
*/
function IsSameDay(dateA, dateB) {
	return dateA.getFullYear() == dateB.getFullYear()
		&& dateA.getMonth() == dateB.getMonth()
		&& dateA.getDate() == dateB.getDate();
}

