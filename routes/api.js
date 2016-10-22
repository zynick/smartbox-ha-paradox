'use strict';

const debug = require('debug')('app:api');
const error = require('debug')('app:error');
const express = require('express');
const SerialPort = require('serialport');

const config = require('../config.json');
const serialInterpreter = require('../controller/serialInterpreter');
const serialResponder = require('../controller/serialResponder');

const router = express.Router();

const SERIAL_USER_CODE = config.paradox.serialUserCode;
const ARM_CODE = 'A'; // A:Regular, F:Force, S:Stay, I:Instant






/* TODO move this shit out to some where else */
/* TODO move this shit out to some where else */
/* TODO move this shit out to some where else */

const mqtt = require('mqtt');
const client = mqtt.connect(config.homeAssistant.mqttURL);
const stateTopic = config.homeAssistant.mqttStateTopic;
const commandTopic = config.homeAssistant.mqttCommandTopic;

// MQTT Status: disarmed | armed_home | armed_away | pending | triggered
// https://home-assistant.io/components/alarm_control_panel.mqtt/
let lastStatus;

// Paradox Area State - 8 Zones
let state = [false, false, false, false, false, false, false, false];

client.on('connect', () => {
    debug('mqtt connected.');
    client.subscribe(stateTopic);
    client.subscribe(commandTopic);
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
    if (topic === stateTopic) {
        lastStatus = message;
        return;
    }

    if (topic === commandTopic) {
        if (message === 'DISARM') {
            const command = `AD001${SERIAL_USER_CODE}\r` +
                `AD002${SERIAL_USER_CODE}\r` +
                `AD003${SERIAL_USER_CODE}\r` +
                `AD004${SERIAL_USER_CODE}\r` +
                `AD005${SERIAL_USER_CODE}\r` +
                `AD006${SERIAL_USER_CODE}\r` +
                `AD007${SERIAL_USER_CODE}\r` +
                `AD008${SERIAL_USER_CODE}\r`;
            serial.write(command, serial_REFACTOR_ME);
            // client.publish(stateTopic, 'pending'); // TODO should i enable this? need to do something with the response
            return;
        }

        if (message === 'ARM_HOME') {
            const command = `AA001S${SERIAL_USER_CODE}\r` +
                `AA002S${SERIAL_USER_CODE}\r` +
                `AA003S${SERIAL_USER_CODE}\r` +
                `AA004S${SERIAL_USER_CODE}\r` +
                `AA005S${SERIAL_USER_CODE}\r` +
                `AA006S${SERIAL_USER_CODE}\r` +
                `AA007S${SERIAL_USER_CODE}\r` +
                `AA008S${SERIAL_USER_CODE}\r`;
            serial.write(command, serial_REFACTOR_ME);
            // client.publish(stateTopic, 'pending'); // TODO should i enable this? need to do something with the response
            return;
        }

        if (message === 'ARM_AWAY') {
            const command = `AA001A${SERIAL_USER_CODE}\r` +
                `AA002A${SERIAL_USER_CODE}\r` +
                `AA003A${SERIAL_USER_CODE}\r` +
                `AA004A${SERIAL_USER_CODE}\r` +
                `AA005A${SERIAL_USER_CODE}\r` +
                `AA006A${SERIAL_USER_CODE}\r` +
                `AA007A${SERIAL_USER_CODE}\r` +
                `AA008A${SERIAL_USER_CODE}\r`;
            serial.write(command, serial_REFACTOR_ME);
            // client.publish(stateTopic, 'pending'); // TODO should i enable this? need to do something with the response
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
            client.publish(stateTopic, 'armed_away');
            break;

        case '064': // Status 1
            if (lastStatus !== 'triggered') {
                _n = output.substr(5, 3);
                switch (_n) {
                    case '000': // Armed
                    case '001': // Force Armed
                        client.publish(stateTopic, 'armed_away');
                        break;
                    case '002': // Stay Armed
                    case '003': // Instant Armed
                        client.publish(stateTopic, 'armed_home');
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
            client.publish(stateTopic, 'disarmed');
            break;

        case '024': // Zone in Alarm
            _a = output.substr(9, 3);
            _a = parseInt(_a);
            state[_a - 1] = true;
            client.publish(stateTopic, 'triggered');
            break;

        case '026': // Zone Alarm Restore
            _a = output.substr(9, 3);
            _a = parseInt(_a);
            state[_a - 1] = false;

            function isAllAlarmOff() {
                return !(state[0] || state[1] || state[2] || state[3] || state[4] || state[5] || state[6] || state[7]);
            }

            if (isAllAlarmOff()) {
                client.publish(stateTopic, 'disarmed');
            }
            break;

        case '065': // Status 2
            _n = output.substr(5, 3);
            if (_n === '001') { // Exit Delay
                client.publish(stateTopic, 'pending');
            }
            break;
    }
}

/* TODO move this shit out to some where else (END) */
/* TODO move this shit out to some where else (END) */
/* TODO move this shit out to some where else (END) */



/* Initialize Serial */

const serialPort = config.paradox.serialPort;
const serialOptions = {
    baudrate: 2400,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    parser: SerialPort.parsers.readline('\r')
};
const serial = new SerialPort(serialPort, serialOptions);

serial.on('open', () => {
    debug('serial port connected.');
});

let _readData = (buffer) => {
    const output = buffer.toString();

    if (output.length === 12 && output.charAt(0) === 'G' &&
        output.charAt(4) === 'N' && output.charAt(8) === 'A') {
        serialInterpreter(output);
        trigger(output);
    } else {
        debug(`unknown data received: ${output}`);
    }

};

serial.on('data', _readData);



/* General Functions */

function read(input, res) {

    serial.removeListener('data', _readData);

    _readData = (buffer) => {

        const output = buffer.toString();

        if (output.length === 12 && output.charAt(0) === 'G' &&
            output.charAt(4) === 'N' && output.charAt(8) === 'A') {
            serialInterpreter(output);
            trigger(output);
        } else {
            debug(`unknown data received: ${output}`);
        }

        if (!res.headerSent) {
            const result = serialResponder(input, output);
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
            error(err.message);
            if (!res.headerSent) {
                res.send(err);
            }
        }
    };
}


/* Standard Command */

router.get('/command/:command', (req, res) => {
    const command = req.params.command;
    read(command.substr(0, 5), res);
    serial.write(`${command}\r`, write(res));
});

/* Area */

router.get('/area/status/:id', (req, res) => {
    const input = `RA${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

router.get('/area/label/:id', (req, res) => {
    const input = `AL${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

router.get('/area/arm/:id', (req, res) => {
    const input = `AA${req.params.id}`;
    read(input, res);
    serial.write(`${input}${ARM_CODE}${SERIAL_USER_CODE}\r`, write(res));
});

router.get('/area/quickarm/:id', (req, res) => {
    const input = `AQ${req.params.id}`;
    read(input, res);
    serial.write(`${input}${ARM_CODE}${SERIAL_USER_CODE}\r`, write(res));
});

router.get('/area/disarm/:id', (req, res) => {
    const input = `AD${req.params.id}`;
    read(input, res);
    serial.write(`${input}${SERIAL_USER_CODE}\r`, write(res));
});

router.get('/area/panic/emergency/:id', (req, res) => {
    const input = `PE${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

router.get('/area/panic/medical/:id', (req, res) => {
    const input = `PM${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

router.get('/area/panic/fire/:id', (req, res) => {
    const input = `PF${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

router.get('/area/smoke/reset/:id', (req, res) => {
    const input = `SR${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

/* Zone */

router.get('/zone/status/:id', (req, res) => {
    const input = `RZ${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

router.get('/zone/label/:id', (req, res) => {
    const input = `ZL${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

/* User */

router.get('/user/label/:id', (req, res) => {
    const input = `UL${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});

/* Utility Keys */

router.get('/utility/:id', (req, res) => {
    const input = `UK${req.params.id}`;
    read(input, res);
    serial.write(`${input}\r`, write(res));
});



module.exports = router;
