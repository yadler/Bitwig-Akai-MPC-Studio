// Akai MPC Studio Mapping for Bitwig Studio (1.1)
// by Yves Adler

loadAPI(1);

host.defineController("Akai", "MPC Studio", "1.0", "F5D3FCF0-8113-11E4-B4A9-0800200C9A66");
host.defineSysexIdentityReply("F0 7E 00 06 02 47 13 00 19 00 01 01 00 00 00 00 00 00 4B 31 31 33 30 31 30 32 37 39 31 34 ?? ?? ?? ?? F7");
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
    switchBank();
}

function MPCStudio()
{
    this.shiftMode = false;
    this.bank = 1;
    
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
    
    this.midiInPads = host.getMidiInPort(0).createNoteInput("Pads", "?9????");
	this.midiInPads.setShouldConsumeEvents(false);
    this.midiInPads.assignPolyphonicAftertouchToExpression(9, NoteExpression.TIMBRE_UP, 5 );
    this.padTranslation = initArray(-1, 128);
    
    this.buttons = {
        "bankA"         : 35,
        "bankB"         : 36,
        "bankC"         : 37,
        "bankD"         : 38,
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

function switchBank()
{
    // TODO simplify code
    var padOffset = 12;
    
    println("switchBank to " + mpcStudio.bank + " - base offset: " + mpcStudio.bank * 16);
    
    // TODO: docstate and stuff with value observers
    var button = 34 + mpcStudio.bank;
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 35, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 36, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 37, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 38, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, button, MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY);
    
    mpcStudio.padTranslation[37] = mpcStudio.bank * padOffset - padOffset;
    println("pad1: " +padTranslation[37]);
    mpcStudio.padTranslation[36] = mpcStudio.bank * padOffset - (padOffset - 1);
    mpcStudio.padTranslation[42] = mpcStudio.bank * padOffset - (padOffset - 2);
    mpcStudio.padTranslation[82] = mpcStudio.bank * padOffset - (padOffset - 3);
    
    mpcStudio.padTranslation[40] = mpcStudio.bank * padOffset - (padOffset - 4);
    mpcStudio.padTranslation[38] = mpcStudio.bank * padOffset - (padOffset - 5);
    mpcStudio.padTranslation[46] = mpcStudio.bank * padOffset - (padOffset - 6);
    mpcStudio.padTranslation[44] = mpcStudio.bank * padOffset - (padOffset - 7);
    
    mpcStudio.padTranslation[48] = mpcStudio.bank * padOffset - (padOffset - 8);
    mpcStudio.padTranslation[47] = mpcStudio.bank * padOffset - (padOffset - 9);
    mpcStudio.padTranslation[45] = mpcStudio.bank * padOffset - (padOffset - 10);
    mpcStudio.padTranslation[43] = mpcStudio.bank * padOffset - (padOffset - 11);
    
    mpcStudio.padTranslation[49] = mpcStudio.bank * padOffset + 0;
    mpcStudio.padTranslation[55] = mpcStudio.bank * padOffset + 1;
    mpcStudio.padTranslation[51] = mpcStudio.bank * padOffset + 2;
    mpcStudio.padTranslation[53] = mpcStudio.bank * padOffset + 3;
    
	mpcStudio.midiInPads.setKeyTranslationTable(padTranslation);
}

function onMidi(status, data1, data2)
{
    var midi = new MidiData(status, data1, data2);
    println("onMidi -> ST: " + midi.status + " / D1: " + midi.data1 + " / D2: " + midi.data2 + " / CH: " + getChannel(midi) + " / TYPE: " + getMidiType(midi));
    
    switch (getChannel(midi)) {
        case 0:
            handleControlButtons(midi);
            break;
        case 9:
            handlePads(midi)
            break;
    }
}

function handleControlButtons(midi)
{
    if (midi.data2 > 64) {
        switch(midi.data1) {
            case mpcStudio.buttons["bankA"]:
                mpcStudio.bank = 1;
                switchBank();
                break;
            case mpcStudio.buttons["bankB"]:
                mpcStudio.bank = 2;
                switchBank();
                break;
            case mpcStudio.buttons["bankC"]:
                mpcStudio.bank = 3;
                switchBank();
                break;
            case mpcStudio.buttons["bankD"]:
                mpcStudio.bank = 4;
                switchBank();
                break;
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
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_PADS, midi.data1, midi.data2 > 0 ? MPC_STUDIO_MIDI_OUT_PAD_COLOR_RED : MPC_STUDIO_MIDI_OUT_PAD_COLOR_DARK_GREEN);
}

function onSysex(data)
{
	printSysex(data);
}

function exit()
{
}


// helpers below
function getChannel(midi) {
    return(midi.status & 0xF);
}

function getMidiType(midi) {
    var test = midi.status & 0xF0;
    switch(test) {
        case 0x80:
           return "NoteOff";
        case 0x90:
           // Note on with Velocity 0 is also considered Note Off:
           if(midi.data1 === 0) {
              return "NoteOff";
           }
           else {
              return "NoteOn";
           }
        case 0xA0:
           return "KeyPressure";
        case 0xB0:
           return "CC";
        case 0xC0:
           return "ProgramChange";
        case 0xD0:
           return "ChannelPressure";
        case 0xE0:
           return "PitchBend";
    };
    return "Other";
}
   
function MidiData(status, data1, data2) {
   this.status = status;
   this.data1 = data1;
   this.data2 = data2;
}
