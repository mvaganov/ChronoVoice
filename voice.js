/**
@param text {string} what to say
@param voice {string} voice to use to say it
@param callback {function(Error)} what to call when the voice is finished
*/
function Voice_Speak(text, voice, callback) {
	var mute = ById('mute'); // console.log(mute);
	if(mute != null && mute.checked) { return; }
	var u = new SpeechSynthesisUtterance();
	u.text = text;
	if((typeof voice) == 'string') { voice = Voice_GetVoiceObject(voice); }
	if(voice) {
		console.log(voice.name+": "+text);
		u.voice = voice;
	}
	u.onend   = function ()  { if (callback) { callback(null); } };
	u.onerror = function (e) { if (callback) { callback(e);    } };
	speechSynthesis.speak(u);
}

/**
@param {string} voicename
@return {SpeechSynthesisVoice} or null if there is no voice by the given name
*/
function Voice_GetVoiceObject(voicename) {
	if(voicename) {
		voicename = voicename.toLowerCase();
		voices = speechSynthesis.getVoices();
		for(var i = 0; i < voices.length; ++i) {
			if(voices[i].name.toLowerCase() == voicename.toLowerCase()) {
				return voices[i];
			}
		}
	}
	return null;
}
function PopulateVoiceDropdown() {
	var dropdownName = "voiceselect";
	// var outstring = "voices available: ";
	var select = document.getElementById(dropdownName);
	if (!select) {
		console.error("need a dropdown named '" + dropdownName + "'");
	}
	for(var i = select.options.length - 1; i >= 0; i--) { select.options[i] = null; }
	voices = speechSynthesis.getVoices();
	for(var i = 0; i < voices.length; ++i) {
		var option = document.createElement("option");
		option.text = voices[i].name+" ("+voices[i].lang+")";
		option.value = voices[i].name;
		select.appendChild(option);
		// outstring += ((i>0)?", ":"")+option.text;
	}
	// console.log(outstring);
}
(function Voice_Initialize() {
	// prompt the speechSynthesis object to load some voices
	if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
		speechSynthesis.onvoiceschanged = PopulateVoiceDropdown;
	}
})();
