'use strict';

const debug = require('debug')('app:api');
const error = require('debug')('app:error');
const express = require('express');
const SerialPort = require('serialport');

const router = express.Router();

const serialInterpreter = require('../controller/serialInterpreter');
const serialResponse = require('../controller/serialResponse');

const SERIAL_PASS = '1234';
const ARM_CODE = 'A'; // A:Regular, F:Force, S:Stay, I:Instant








/* TODO move this shit out to some where else */
/* TODO move this shit out to some where else */
/* TODO move this shit out to some where else */

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');

// mqtt status: disarmed | armed_home | armed_away | pending | triggered
// https://home-assistant.io/components/alarm_control_panel.mqtt/
let lastStatus;

// paradox area state - 8 zones
let state = [false, false, false, false, false, false, false, false];

client.on('connect', () => {
    debug('mqtt connected.');
    client.subscribe('smartbox/alarm');
    client.subscribe('smartbox/alarm/set');
});

function serial_REFACTOR_ME(err) {
    if (err) {
        error(err.message);
    }
}

client.on('message', (topic, buffer) => {
    const message = buffer.toString();
    debug(`mqtt topic: ${topic}, message: ${message}`);

    // process received message
    if (topic === 'smartbox/alarm') {
        lastStatus = message;
        return;
    }

    if (topic === 'smartbox/alarm/set') {
        if (message === 'DISARM') {
            const command = `AD001${SERIAL_PASS}\r` +
                `AD002${SERIAL_PASS}\r` +
                `AD003${SERIAL_PASS}\r` +
                `AD004${SERIAL_PASS}\r` +
                `AD005${SERIAL_PASS}\r` +
                `AD006${SERIAL_PASS}\r` +
                `AD007${SERIAL_PASS}\r` +
                `AD008${SERIAL_PASS}\r`;
            serial.write(command, serial_REFACTOR_ME);
            // client.publish('smartbox/alarm', 'pending'); // TODO should i enable this?
            return;
        }

        if (message === 'ARM_HOME') {
            const command = `AA001S${SERIAL_PASS}\r` +
                `AA002S${SERIAL_PASS}\r` +
                `AA003S${SERIAL_PASS}\r` +
                `AA004S${SERIAL_PASS}\r` +
                `AA005S${SERIAL_PASS}\r` +
                `AA006S${SERIAL_PASS}\r` +
                `AA007S${SERIAL_PASS}\r` +
                `AA008S${SERIAL_PASS}\r`;
            serial.write(command, serial_REFACTOR_ME);
            // client.publish('smartbox/alarm', 'pending'); // TODO should i enable this?
            return;
        }

        if (message === 'ARM_AWAY') {
            const command = `AA001A${SERIAL_PASS}\r` +
                `AA002A${SERIAL_PASS}\r` +
                `AA003A${SERIAL_PASS}\r` +
                `AA004A${SERIAL_PASS}\r` +
                `AA005A${SERIAL_PASS}\r` +
                `AA006A${SERIAL_PASS}\r` +
                `AA007A${SERIAL_PASS}\r` +
                `AA008A${SERIAL_PASS}\r`;
            serial.write(command, serial_REFACTOR_ME);
            // client.publish('smartbox/alarm', 'pending'); // TODO should i enable this?
            return;
        }
        return;
    }
});

function trigger(output) {
    const _g = output.substr(1, 3);
    let _n, _a;
    switch (_g) {
        case '009': // Arming with Master
        case '010': // Arming with User Code
        case '011': // Arming with Keyswitch
        case '012': // Special Arming
            client.publish('smartbox/alarm', 'armed_away');
            break;

        case '064': // Status 1
            if (lastStatus !== 'triggered') {
                _n = output.substr(5, 3);
                switch (_n) {
                    case '000': // Armed
                    case '001': // Force Armed
                        client.publish('smartbox/alarm', 'armed_away');
                        break;
                    case '002': // Stay Armed
                    case '003': // Instant Armed
                        client.publish('smartbox/alarm', 'armed_home');
                        break;
                }
            }
            break;

        case '013': // Disarm with Master'
        case '014': // Disarm with User Code'
        case '015': // Disarm with Keyswitch'
        case '016': // Disarm after Alarm with Master'
        case '017': // Disarm after Alarm with User Code'
        case '018': // Disarm after Alarm with Keyswitch'
        case '022': // Special Disarm Events'
        case '019': // Alarm Cancelled with Master'
        case '020': // Alarm Cancelled with User Code'
        case '021': // Alarm Cancelled with Keyswitch'
            client.publish('smartbox/alarm', 'disarmed');
            break;

        case '024': // Zone in Alarm
            _a = output.substr(9, 3);
            _a = parseInt(_a);
            state[_a - 1] = true;
            client.publish('smartbox/alarm', 'triggered');
            break;

        case '026': // Zone Alarm Restore
            _a = output.substr(9, 3);
            _a = parseInt(_a);
            state[_a - 1] = false;

            function isAllAlarmOff() {
                return !(state[0] || state[1] || state[2] || state[3] || state[4] || state[5] || state[6] || state[7]);
            }

            if (isAllAlarmOff()) {
                client.publish('smartbox/alarm', 'disarmed');
            }
            break;

        case '065': // Status 2
            _n = output.substr(5, 3);
            if (_n === '001') { // Exit Delay
                client.publish('smartbox/alarm', 'pending');
            }
            break;
    }
}

/* TODO move this shit out to some where else (END) */
/* TODO move this shit out to some where else (END) */
/* TODO move this shit out to some where else (END) */



/* Initialize Serial */

const usbPort = '/dev/tty.usbserial-a40069b4';
const serialOptions = {
    baudrate: 2400,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    parser: SerialPort.parsers.readline('\r')
};
const serial = new SerialPort(usbPort, serialOptions);

serial.on('open', () => {
    debug('serial port connected.');
});

let _readData = (buffer) => {
    const output = buffer.toString();

    if (output.length === 12 && output.charAt(0) === 'G' &&
        output.charAt(4) === 'N' && output.charAt(8) === 'A') {
        serialInterpreter(output);  // TODO async TODO TODO TODO TODO
        trigger(output);
        return;
    }

    debug(`unknown data received: ${output}`);
};

serial.on('data', _readData);



/* General Functions */

function read(input, res) {

    serial.removeListener('data', _readData);

    _readData = function(buffer) {

        const output = buffer.toString();

        if (output.length === 12 && output.charAt(0) === 'G' &&
            output.charAt(4) === 'N' && output.charAt(8) === 'A') {
            serialInterpreter(output);
            trigger(output);
            return;
        }

        debug(`unknown data received: ${output}`);

        if (!res.headerSent) {
            const result = serialResponse(input, output);  // TODO async
            if (result) {
                res.json(result);
            }
        }
    };

    serial.on('data', _readData);
}

function write(res) {
    return (err) => {
        if (err) {
            error('ERROR', err);
            if (!res.headerSent) {
                res.send(err);
            }
        }
    };
}


/* Standard Command */

router.get('/command/:command', (req, res, next) => {
    const command = req.params.command;
    read(command.substr(0, 5), res);
    serial.write(`${command}\r`, write);
});

/* Area */

router.get('/area/status/:id', (req, res, next) => {
    const input = `RA${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

router.get('/area/label/:id', (req, res, next) => {
    const input = `AL${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

router.get('/area/arm/:id', (req, res, next) => {
    const input = `AA${req.params.id}`;
    read(input, res);
    serial.write(`${input}${ARM_CODE}${SERIAL_PASS}\r`, write);
});

router.get('/area/quickarm/:id', (req, res, next) => {
    const input = `AQ${req.params.id}`;
    read(input, res);
    serial.write(`${input}${ARM_CODE}${SERIAL_PASS}\r`, write);
});

router.get('/area/disarm/:id', (req, res, next) => {
    const input = `AD${req.params.id}`;
    read(input, res);
    serial.write(`${input}${SERIAL_PASS}\r`, write);
});

router.get('/area/panic/emergency/:id', (req, res, next) => {
    const input = `PE${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

router.get('/area/panic/medical/:id', (req, res, next) => {
    const input = `PM${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

router.get('/area/panic/fire/:id', (req, res, next) => {
    const input = `PF${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

router.get('/area/smoke/reset/:id', (req, res, next) => {
    const input = `SR${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

/* Zone */

router.get('/zone/status/:id', (req, res, next) => {
    const input = `RZ${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

router.get('/zone/label/:id', (req, res, next) => {
    const input = `ZL${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

/* User */

router.get('/user/label/:id', (req, res, next) => {
    const input = `UL${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});

/* Utility */

router.get('/utility/:id', (req, res, next) => {
    const input = `UK${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write);
});



module.exports = router;
