// TODO breakup into "block.js", "occaision.js", "alarmset.js"
var DEFAULT_SPECIFICATIONS = {
	rootFile:"dates.txt",
	spec:{
		// order of the alarms here determines priority when speech marks an occaision
		alarms:[{
			label:"<10m", beginOrEnd:"end", time:10,  randomVoice: true,
			message:"You should know that $(name) ends in 10 minutes",
			voiceChoice: ["Samantha", "Daniel", "Alex", "Veena", "Karen", "Tessa", "English Male", "Mark", "David", "Zira"],
		},{
			label:"<5m", beginOrEnd:"end", time:5, randomVoice: true,
			message:"Oh! $(name) ends in 5 minutes",
			voiceChoice: ["Daniel", "Alex", "Veena", "Karen", "Tessa", "Samantha", "English Male", "Mark", "David", "Zira"]
		},{
			label:"<1m", beginOrEnd:"end", time:1, randomVoice: true,
			message:"Hey! $(name) is almost over!",
			voiceChoice: ["Alex", "Veena", "Karen", "Tessa", "Samantha", "Daniel", "English Male", "Mark", "David", "Zira"],
		},{
			label:"done", beginOrEnd:"end", time:0, randomVoice: true,
			message:"$(name) is over.",
			voiceChoice: ["Veena", "Karen", "Tessa", "Samantha", "Daniel", "Alex", "English Male", "Mark", "David", "Zira"],
		},{
			label:"begin", beginOrEnd:"beg", time:0, randomVoice: true,
			message:"$(name) begins now.",
			voiceChoice: ["Karen", "Tessa", "Samantha", "Daniel", "Alex", "Veena", "English Male", "Mark", "David", "Zira"],
		}], periodNameTranslation:{
		A:"A. period",B:"B period", C:"C period", D:"D period", E:"E period",
		F:"F period", G:"G period", W:"W period", X:"X period", Y:"Y period",
		Z:"Z period", OH:"office hours", SL:"the assembly",
		ACT:"spirit week assembly", Mtg:"meeting time", END:"end",
		}
	}
};
var Alarm_STANDARD_FILE = JSON.stringify(DEFAULT_SPECIFICATIONS, null, 2);

/** @class components of a school schedule */
function Block(name = "", startTime="12:00", endTime=null, baseDate=null) {
	if(endTime == null) { endTime = startTime; }
	this.name = "";
	this.alarmsUsed = [];
	this.Set(name, startTime, endTime, baseDate);
}

Block.prototype.toString = function() {
	return this.name+": " + Date_YYYYMMDDTHHMM(this.start) + " to " + Date_YYYYMMDDTHHMM(this.end) +
		((this.alarmsUsed && this.alarmsUsed.length>0) ? " " + this.alarmsUsed : "");
}

/**
@param name {string}
@param startTime {string}
@param endTime {string}
*/
Block.prototype.Set = function(name, startTime, endTime, baseDate=null) {
	if(name) { this.name = name.trim(); }
	if(!baseDate){baseDate=newDate();}
	t = new Date(baseDate);
	function breakTimeText(txt) {
		var out = null;
		if(txt.indexOf(":") >= 0) {
			out = String_SplitClean(txt, Parse_COLON);
		} else if(txt.length >= 3) {
			var l = txt.length;
			out = [txt.substring(0,l-2),txt.substring(l-2, l)];
		} else { out = [txt,"00"]; }
		return out;
	}
	if(startTime instanceof Date) {
		this.start = startTime;
	} else {
		var start = breakTimeText(startTime);
		var startCal = new Date(baseDate);
		if(startTime) {
			startCal = new Date(t.getFullYear(), t.getMonth(), t.getDate(), parseInt(start[0]), parseInt(start[1]), 0, 0);
		}
		this.start = startCal;
	}
	if(endTime instanceof Date) {
		this.end = endTime;
	} else {
		var end   = breakTimeText(endTime);
		var endCal = new Date(baseDate);
		if(endTime) {
			endCal = new Date(t.getFullYear(), t.getMonth(), t.getDate(), parseInt(end[0]), parseInt(end[1]), 0, 0);
		}
		this.end = endCal;
	}
}

Block.prototype.getDurationMinutes = function() { return parseInt((Seconds(this.end) - Seconds(this.start))/60); }

/** @class
single points of time, which when triggered, result in the computer speaking some text
*/
function Occasion (text = "", when = null, priority = 0, voicesList = null, randomVoice = false) {
	this.text = text;
	this.voice = null;
	this.triggered = false;
	this.enabled = true;
	this.priority = priority;
	if(!when) this.moment = newDate();
	else this.moment = when;
	function shuffleArray(array) {
		for (var i = array.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = array[i]; array[i] = array[j]; array[j] = temp;
		}
		return array;
	}
	/**
	@param voicelist {string[]} names
	@return {SpeechSynthesisVoice} first valid voice from the given list
	*/
	function GetTheVoiceThatWorksFrom(voicesList) {
		for(var i = 0; i < voicesList.length; ++i) {
			voicesList[i] = voicesList[i].trim();
			var actualVoice = Voice_GetVoiceObject(voicesList[i]);
			if(actualVoice != null) { return actualVoice; }
		}
		return null;
	}
	if(voicesList) {
		if(randomVoice) { voicesList = shuffleArray(voicesList.slice(0)); }
		this.voice = GetTheVoiceThatWorksFrom(voicesList);
	}
}
Occasion.prototype.toString = function() {
	return Date_YYYYMMDDTHHMM(this.moment) + " : " + (this.voice!=null?this.voice.name+":":"") +this.text; }

/** @return a new Occasion marker */
var Occasion_minutesBeforeEnd = function(block, text, minutes, priority, voiceList, randomVoice = false) {
	var m = new Occasion(text, new Date(block.end), priority, voiceList, randomVoice);
	m.addMinutes(-minutes);
	return m;
}
/**
@param block {Block}
@param text {string}
@param minutes {Number}
@param priority {Number}
@param voiceList {string[]}
@return {Occasion} a new Occasion marker
*/
var Occasion_minutesAfterBegin = function(block, text, minutes, priority, voiceList, randomVoice = false) {
	var m = new Occasion(text, new Date(block.start), priority, voiceList, randomVoice);
	m.addMinutes(minutes);
	return m;
}
Occasion.prototype.addMinutes = function(minutes) {
	this.moment.setMinutes(this.moment.getMinutes()+minutes);
}
Occasion.prototype.isNow = function(lagTimeSeconds = 60) {
	var diff = Seconds() - Seconds(this.moment);
	return diff > 0 && diff < lagTimeSeconds;
}
Occasion.prototype.isTriggered = function() { return this.triggered != 0; }
Occasion.prototype.trigger = function() {
	this.triggered++;
	Voice_Speak(this.text, this.voice);
}
var Occasion_minutesBetween = function(now, soon) {
	return ((Seconds(soon.moment) - Seconds(now.moment))/60);
}
function ConvertDateToUTCString(date, includeHrMinSec = false) {
	return date.getFullYear()
	+"-"+String_NumberLead0s(date.getMonth()+1, 2)
	+"-"+String_NumberLead0s(date.getDate(),2)
	+(includeHrMinSec?("T"
	+String_NumberLead0s(date.getHours(),2)
	+String_NumberLead0s(date.getMinutes(),2)
	+String_NumberLead0s(date.getSeconds(),2)
	):"");
}

function ConvertUTCToDate(tstamp, useLocalTime = false) {
	var d = newDate();
	var index = 0, cursor = 0;
	cursor = tstamp.indexOf("-", index);
	var YYYY = tstamp.substring(index,cursor); index = cursor+1;
	cursor = tstamp.indexOf("-", index);
	var MM = tstamp.substring(index,cursor); index = cursor+1;
	cursor = tstamp.indexOf("T", index);
	if(cursor < 0) { cursor = tstamp.length; }
	var DD = Number(tstamp.substring(index,cursor)); index = cursor+1;
	var hh = 0, mm = 0, ss = 0;
	if(useLocalTime) {
		d = new Date(YYYY, MM-1, DD);
	} else {
		d = new Date(Date.UTC(YYYY, MM-1, DD));
	}
	if(index < tstamp.length){
		hh = Number(tstamp.substring(index,index+2)); index += 2;
		mm = Number(tstamp.substring(index,index+2)); index += 2;
		ss = Number(tstamp.substring(index,index+2)); index += 2;
		d = new Date(Date.UTC(YYYY, MM-1, DD, hh, mm, ss));
	}
	return d;
}

/** @param realScheduleText {string} */
function ParseDaySchedule(realScheduleText) {
	/** {string[][]} */
	var scheduleTable = [];
	var lines = String_Split(realScheduleText, ["\n","\r"], false);
	var colonIndex = Parse_TOKEN_BREAKING_CHARS.indexOf(":");
	var breakingCharsWithoutColor = Parse_TOKEN_BREAKING_CHARS.toSpliced(colonIndex, 1);
	for(var b=0; b<lines.length; ++b) {
		var result = [];
		var parseCursor = new Parse_Cursor();
		parseCursor.breakingChars = breakingCharsWithoutColor;
		Parse_IntoList(lines[b], parseCursor, result);
		console.log(result);
		scheduleTable.push(result);
	}
	return scheduleTable;
}

/** @param daySchedule {string[][]} */
function DayScheduleToBlocks(daySchedule) {
	var date = null;
	blocks = [];
	for(var row = 0;row < daySchedule.length; ++row) {
		var b = new Block(daySchedule[row][0], daySchedule[row][1], daySchedule[row][2], date);
		blocks.push(b);
	}
	return blocks;
}

/**
@param blocks {Block[]}
@param blockAlarms {{label {string}, beginOrEnd {string}, time {int}, message {string}, randomVoice {bool}, voiceChoice {string[]}}[]}
@return {Occasion[]}
*/
function BlocksToOccasions(blocks, blockAlarms) {
	var occasions = [];
	var a = this;
	var now = new Occasion();
	// @type {number[]}
	var minutesList = [];
	function __AddOccasion(toAdd) {
		var minutes = Occasion_minutesBetween(now, toAdd);
		// insert the occasions in order, with soonest first
		var index = 0;
		for(;index < minutesList.length && minutesList[index] <= minutes; ++index);
		minutesList.splice(index, 0, minutes);
		occasions.splice(index, 0, toAdd);
	}
	for(var i = 0; i < blocks.length; ++i) {
		var b = blocks[i];
		if(!b) {
			console.log("null block?");
			console.log(blocks);
			continue;
		}
		var duration = b.getDurationMinutes();
		if (duration == 0) {
			__AddOccasion(Occasion_minutesAfterBegin(b, b.name, 0, -1, null));
			continue;
		}
		var toReplace = ["$(name)"], toReplaceWith = [b.name];
		for(var n = 0; n < blockAlarms.length; n++) {
			var toAdd = AlarmOccaisionForBlock(n, b, blockAlarms[n], toReplace, toReplaceWith);
			if(toAdd && toAdd.text.length != 0) {
				__AddOccasion(toAdd);
			}
		}
	}
	return occasions;
}

/**
 * @param priority {Number} lower means it will be prioritized
 * @param b {Block}
 * @param alarmDetails {} what kind of alarm to set for the given block
 * @param toReplace {string[]} what values to replace
 * @param toReplaceWith {string[]} what values to replace will be replaced with
 */
function AlarmOccaisionForBlock(priority, b, alarmDetails, toReplace, toReplaceWith){
	var offsetFromEvent = parseInt(alarmDetails.time);
	if(b.getDurationMinutes() < offsetFromEvent) {
		return null;
	}
	var text = String_Replace(alarmDetails.message, toReplace, toReplaceWith);
	var toAdd = null;
	if(alarmDetails.beginOrEnd[0].toLowerCase() == "e") {
		toAdd = Occasion_minutesBeforeEnd(b, text, offsetFromEvent, priority, alarmDetails.voiceChoice, alarmDetails.randomVoice);
	} else {
		toAdd = Occasion_minutesAfterBegin(b, text, offsetFromEvent, priority, alarmDetails.voiceChoice, alarmDetails.randomVoice);
	}
	return toAdd;
}
