// Akai MPC Studio Mapping for Bitwig Studio (1.1)
// by Yves Adler

load("Extensions.js");
loadAPI(1);

host.defineController("Akai", "MPC Studio", "1.0", "F5D3FCF0-8113-11E4-B4A9-0800200C9A66");
host.defineSysexIdentityReply("F0 7E 00 06 02 47 13 00 19 00 01 01 00 00 00 00 00 00 4B 31 31 33 30 31 30 32 37 39 31 34 32 30 36 30 F7");
host.defineMidiPorts(1, 1);
host.addDeviceNameBasedDiscoveryPair(["MPC Public"], ["MPC Public"]);


var MPC_STUDIO_MIDI_OUT_PADS = 185
var MPC_STUDIO_MIDI_OUT_PAD_COLOR_DARK_GREEN = 1
var MPC_STUDIO_MIDI_OUT_PAD_COLOR_GREEN = 7
var MPC_STUDIO_MIDI_OUT_PAD_COLOR_RED = 48
var MPC_STUDIO_MIDI_OUT_PAD_COLOR_ORANGE = 127

var MPC_STUDIO_MIDI_OUT_BUTTONS = 186
var MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY = 1
var MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_SECONDARY = 2

var mpcStudio = null;
function init()
{
    mpcStudio = MPCStudio()
}

function MPCStudio()
{
    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);
    host.getMidiOutPort(0).setShouldSendMidiBeatClock(true);
    
    // Blink with all
    for (var i = 0; i < 128; i++) {
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_PADS, i, MPC_STUDIO_MIDI_OUT_PAD_COLOR_ORANGE);
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, i, MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY);
    }
    for (var i = 0; i < 128; i++) {
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_PADS, i, MPC_STUDIO_MIDI_OUT_PAD_COLOR_DARK_GREEN);
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, i, 0);
    }
    
        //host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_PADS, 37, MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_SECONDARY);
    
    // -------------------------------------------------------------
    // PADS: WIP
    
    this.midiInPads = host.getMidiInPort(0).createNoteInput("Pads", "?9????");
	this.midiInPads.setShouldConsumeEvents(false);
    
    
    var padTranslation = initArray(-1, 128);
    padTranslation[37] = 0;
    padTranslation[36] = 1;
    padTranslation[42] = 2;
    padTranslation[82] = 3;
    
    padTranslation[40] = 4;
    padTranslation[38] = 5;
    padTranslation[46] = 6;
    padTranslation[44] = 7;
    
    padTranslation[48] = 8;
    padTranslation[47] = 9;
    padTranslation[45] = 10;
    padTranslation[43] = 11;
    
    padTranslation[49] = 12;
    padTranslation[55] = 13;
    padTranslation[51] = 14;
    padTranslation[53] = 15;
    
    // var offset = 1;
	// for (var i = 0; i < 128; i++)
	// {
		// padTranslation[i] = offset + i;
		// if (padTranslation[i] < 0 || padTranslation[i] > 127) {
			// padTranslation[i] = -1;
		// }
	// }
	this.midiInPads.setKeyTranslationTable(padTranslation);
	//padTrans.set(Math.floor(offset/8), 1);;
    //this.midiInPads.setShouldConsumeEvents(false);
    // Translate Poly AT to Timbre:
    this.midiInPads.assignPolyphonicAftertouchToExpression(9, NoteExpression.TIMBRE_UP, 5 );
    
    // PADS lights:
    //for (var i = 0; i < 127; i++) {
    //    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTON_COLOR, i, 1);
    //}
    
    // -------------------------------------------------------------  
        
    this.buttons = {
        "tapTempo"      : 53,
        "playStart"     : 113,
        "play"          : 118,
        "stop"          : 117,
        "overdub"       : 114,
        "record"        : 119,
    }
        
    this.transport = host.createTransport();
    this.transport.addIsPlayingObserver(function(isPlaying) {
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 82, isPlaying ? MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY : 0);
    });
    this.transport.addOverdubObserver(function(isOberdub) {
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 80, isOberdub ? MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY : 0);
    });
    this.transport.addIsRecordingObserver(function(isRecording) {
        host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 73, isRecording ? MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY : 0);
    });

    return this;
}

function onMidi(status, data1, data2)
{
    var midi = new MidiData(status, data1, data2);
    println("onMidi -> ST: " + midi.status + " / D1: " + midi.data1 + " / D2: " + midi.data2 + " / CH: " + midi.channel() + " / TYPE: " + midi.type());
    
    switch (midi.channel()) {
        case 0:
            handleLaunchControls(midi);
            break;
        case 9:
            handlePads(midi)
            break;
    }
}

function handleLaunchControls(midi)
{
    if (midi.isOn()) {
        switch(midi.data1) {
            case mpcStudio.buttons["record"]:
                mpcStudio.transport.record();
                break;
            case mpcStudio.buttons["overdub"]:
                mpcStudio.transport.toggleOverdub();
                break;
            case mpcStudio.buttons["stop"]:
                mpcStudio.transport.stop();
                break;
            case mpcStudio.buttons["play"]:
                mpcStudio.transport.play();
                break;
            case mpcStudio.buttons["playStart"]:
                mpcStudio.transport.restart();
                break;
            case mpcStudio.buttons["tapTempo"]:
                mpcStudio.transport.tapTempo();
                break;
        }
    }
}

function handlePads(midi) {
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_PADS, midi.data1, midi.isOn() ? MPC_STUDIO_MIDI_OUT_PAD_COLOR_RED : MPC_STUDIO_MIDI_OUT_PAD_COLOR_DARK_GREEN);
}

function onSysex(data)
{
	printSysex(data);
}

function exit()
{
}
