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
    this.bankOffset = 12;
    
    host.getMidiInPort(0).setMidiCallback(onMidi);
    host.getMidiInPort(0).setSysexCallback(onSysex);
    host.getMidiOutPort(0).setShouldSendMidiBeatClock(true);
    
    docState = host.getDocumentState();
    this.bankSelected = docState.getEnumSetting("Active", "Pad Banks", ["A", "B", "C", "D", "E", "F", "G", "H"], "A");
    this.bankSelected.addValueObserver(function(newBank) {
        bank = (newBank.charCodeAt(0) - 64)
        switchBank();
    });
    
    this.bankMode = docState.getEnumSetting("Offset", "Pad Banks", ["octave", "16"], "octave");
    this.bankMode.addValueObserver(function(mode) {
        if (mode == "octave") {
            bankOffset = 12;
        } else {
            bankOffset = 16;
        }
        switchBank();
    });
    
    
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
        "shift"         : 49,
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
    println("switchBank to " + mpcStudio.bank + " - base offset: " + mpcStudio.bankOffset * mpcStudio.bank);
       
    var button = 35 + (mpcStudio.bank - 1) % 4;
    var color = mpcStudio.bank < 5 ? MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_PRIMARY : MPC_STUDIO_MIDI_OUT_BUTTON_COLOR_SECONDARY;
    
    // bank lights
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 35, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 36, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 37, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, 38, 0);
    host.getMidiOutPort(0).sendMidi(MPC_STUDIO_MIDI_OUT_BUTTONS, button, color);
    
    // pad translations
    mpcStudio.padTranslation = initArray(-1, 128);
    mpcStudio.padTranslation[37] = mpcStudio.bank * mpcStudio.bankOffset - mpcStudio.bankOffset;
    mpcStudio.padTranslation[36] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 1);
    mpcStudio.padTranslation[42] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 2);
    mpcStudio.padTranslation[82] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 3);
    
    mpcStudio.padTranslation[40] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 4);
    mpcStudio.padTranslation[38] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 5);
    mpcStudio.padTranslation[46] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 6);
    mpcStudio.padTranslation[44] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 7);
    
    mpcStudio.padTranslation[48] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 8);
    mpcStudio.padTranslation[47] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 9);
    mpcStudio.padTranslation[45] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 10);
    mpcStudio.padTranslation[43] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 11);
    
    mpcStudio.padTranslation[49] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 12);
    mpcStudio.padTranslation[55] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 13);
    mpcStudio.padTranslation[51] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 14);
    mpcStudio.padTranslation[53] = mpcStudio.bank * mpcStudio.bankOffset - (mpcStudio.bankOffset - 15);
    
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
    // NOTE ON
    if (midi.data2 > 64) {
        switch(midi.data1) {
            case mpcStudio.buttons["shift"]:
                mpcStudio.shiftMode = true;
                break;
            case mpcStudio.buttons["bankA"]:
                mpcStudio.shiftMode ? mpcStudio.bankSelected.set("E") : mpcStudio.bankSelected.set("A");
                break;
            case mpcStudio.buttons["bankB"]:
                mpcStudio.shiftMode ? mpcStudio.bankSelected.set("F") : mpcStudio.bankSelected.set("B");
                break;
            case mpcStudio.buttons["bankC"]:
                mpcStudio.shiftMode ? mpcStudio.bankSelected.set("G") : mpcStudio.bankSelected.set("C");
                break;
            case mpcStudio.buttons["bankD"]:
                mpcStudio.shiftMode ? mpcStudio.bankSelected.set("H") : mpcStudio.bankSelected.set("D");
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
    // NOTE OFF
    else {
        switch(midi.data1) {
            case mpcStudio.buttons["shift"]:
                mpcStudio.shiftMode = false;
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
