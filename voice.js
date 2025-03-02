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
	if(!voicename) {
		return null;
	}
	voicename = voicename.toLowerCase();
	voices = speechSynthesis.getVoices();
	// look for exact match of name first
	for(var i = 0; i < voices.length; ++i) {
		if(voices[i].name.toLowerCase() == voicename) {
			return voices[i];
		}
	}
	// look for contains match of name
	for(var i = 0; i < voices.length; ++i) {
		if(voices[i].name.toLowerCase().includes(voicename)) {
			return voices[i];
		}
	}
	// look for exact match of language
	for(var i = 0; i < voices.length; ++i) {
		if(voices[i].lang.toLowerCase() == voicename) {
			return voices[i];
		}
	}
	return null;
}
function PopulateVoiceDropdown() {
	voices = speechSynthesis.getVoices();
	var dropdownName = "voiceselect";
	(function CooperativeLoop() {
		var select = document.getElementById(dropdownName);
		if (!select) {
			setTimeout(CooperativeLoop, 5);
		} else {
			Voice_ApplyVoicesToDrowndown(select, voices);
		}
	})();
}

function Voice_ApplyVoicesToDrowndown(select, voices) {
	for(var i = select.options.length - 1; i >= 0; i--) { select.options[i] = null; }
	for(var i = 0; i < voices.length; ++i) {
		var option = document.createElement("option");
		option.text = voices[i].name + " (" + voices[i].lang + ")";
		option.value = voices[i].name;
		select.appendChild(option);
	}
}

(function Voice_Initialize() {
	// prompt the speechSynthesis object to load some voices
	if (typeof speechSynthesis !== 'undefined' && speechSynthesis.onvoiceschanged !== undefined) {
		speechSynthesis.onvoiceschanged = PopulateVoiceDropdown;
	}
})();
