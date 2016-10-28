'use strict';

const debug = require('debug')('app:api');
const error = require('debug')('app:error');
const express = require('express');
const SerialPort = require('serialport');
const router = express.Router();

const serialInterpreter = process.env.NODE_ENV === 'production' ?
    () => {
        return;
    } : // ignore this function in production
    require('../helpers/serialInterpreter');

const serialResponder = require('../helpers/serialResponder');

const config = require('../config.json');
const {
    stateTopic,
    commandTopic
} = config.homeAssistant.mqtt;
const userCode = config.paradox.serial.userCode;
const armCode = 'A'; // A:Regular, F:Force, S:Stay, I:Instant
const retainOpts = {
    retain: true
};

module.exports = (serial, mqtt) => {

    /**
     * Gave up splitting them into separate component.
     * Perhaps to keep them in a single file for simplicity.
     * Will only work on this if I have more time (and money psfff).
     */



    /**
     * Input From HA (MQTT) --> Paradox (Serial)
     */

    // MQTT Status: disarmed | armed_home | armed_away | pending | triggered
    // https://home-assistant.io/components/alarm_control_panel.mqtt/
    let lastStatus;

    mqtt.on('message', (topic, buffer) => {
        const message = buffer.toString();
        debug(`mqtt ${topic}: ${message}`);

        // process received message from MQTT
        if (topic === stateTopic) {
            lastStatus = message;
            return;
        }

        if (topic === commandTopic) {
            const handleError = (err) => {
                if (err) {
                    error(err);
                }
            };

            if (message === 'DISARM') {
                const command = `AD001${userCode}\r` +
                    `AD002${userCode}\r` +
                    `AD003${userCode}\r` +
                    `AD004${userCode}\r` +
                    `AD005${userCode}\r` +
                    `AD006${userCode}\r` +
                    `AD007${userCode}\r` +
                    `AD008${userCode}\r`;
                serial.write(command, handleError);
                return;
            }

            if (message === 'ARM_HOME') {
                const command = `AA001S${userCode}\r` + // S:Stay
                    `AA002S${userCode}\r` +
                    `AA003S${userCode}\r` +
                    `AA004S${userCode}\r` +
                    `AA005S${userCode}\r` +
                    `AA006S${userCode}\r` +
                    `AA007S${userCode}\r` +
                    `AA008S${userCode}\r`;
                serial.write(command, handleError);
                return;
            }

            if (message === 'ARM_AWAY') {
                const command = `AA001A${userCode}\r` + // A:Regular
                    `AA002A${userCode}\r` +
                    `AA003A${userCode}\r` +
                    `AA004A${userCode}\r` +
                    `AA005A${userCode}\r` +
                    `AA006A${userCode}\r` +
                    `AA007A${userCode}\r` +
                    `AA008A${userCode}\r`;
                serial.write(command, handleError);
                return;
            }
        }
    });




    /**
     * Input from Paradox (Serial) --> HA (mqtt)
     */

    // Paradox Area State - 8 Zones
    let areaState = [false, false, false, false, false, false, false, false];

    function serialEventTrigger(output) {
        const _g = output.substr(1, 3);
        let _n, _a;
        switch (_g) {
            case '009': // Arming with Master
            case '010': // Arming with User Code
            case '011': // Arming with Keyswitch
            case '012': // Special Arming
                mqtt.publish(stateTopic, 'armed_away', retainOpts);
                break;

            case '064': // Status 1
                if (lastStatus !== 'triggered') {
                    _n = output.substr(5, 3);
                    switch (_n) {
                        case '000': // Armed
                        case '001': // Force Armed
                            mqtt.publish(stateTopic, 'armed_away', retainOpts);
                            break;
                        case '002': // Stay Armed
                        case '003': // Instant Armed
                            mqtt.publish(stateTopic, 'armed_home', retainOpts);
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
                mqtt.publish(stateTopic, 'disarmed', retainOpts);
                break;

            case '024': // Zone in Alarm
                _a = output.substr(9, 3);
                _a = parseInt(_a);
                areaState[_a - 1] = true;
                mqtt.publish(stateTopic, 'triggered', retainOpts);
                break;

            case '026': // Zone Alarm Restore
                _a = output.substr(9, 3);
                _a = parseInt(_a);
                areaState[_a - 1] = false;

                function isAllAlarmOff() {
                    return !(areaState[0] || areaState[1] || areaState[2] || areaState[3] ||
                        areaState[4] || areaState[5] || areaState[6] || areaState[7]);
                }

                if (isAllAlarmOff()) {
                    mqtt.publish(stateTopic, 'disarmed', retainOpts);
                }
                break;

            case '065': // Status 2
                _n = output.substr(5, 3);
                if (_n === '001') { // Exit Delay
                    mqtt.publish(stateTopic, 'pending', retainOpts);
                }
                break;
        }
    }

    function serialCommandTrigger(output) {
        if (!output.includes('&ok')) {
            return;
        }

        if (output.includes('AD')) {
            mqtt.publish(stateTopic, 'disarmed', retainOpts);
        }
    }


    // Read From Serial Function

    let _serialRead = (buffer) => {
        const output = buffer.toString();

        if (output.length === 12 && output.charAt(0) === 'G' &&
            output.charAt(4) === 'N' && output.charAt(8) === 'A') {
            serialInterpreter(output);
            serialEventTrigger(output);
        } else {
            debug(`serial: ${output}`);
            serialCommandTrigger(output);
        }
    };

    serial.on('data', _serialRead);

    function serialRead(input, res) {

        serial.removeListener('data', _serialRead);

        _serialRead = (buffer) => {
            const output = buffer.toString();

            if (output.length === 12 && output.charAt(0) === 'G' &&
                output.charAt(4) === 'N' && output.charAt(8) === 'A') {
                serialInterpreter(output);
                serialEventTrigger(output);
            } else {
                debug(`serial: ${output}`);
                serialCommandTrigger(output);
            }

            if (!res.headerSent) {
                const result = serialResponder(input, output);
                if (result) {
                    res.json(result);
                }
            }
        };

        serial.on('data', _serialRead);
    }

    function handleErrorResponse(res) {
        return (err) => {
            if (err) {
                error(err);
                if (!res.headerSent) {
                    res.send(err);
                }
            }
        };
    }




    /**
     * Routes
     */

    /* Standard Command */

    router.get('/command/:command', (req, res) => {
        const command = req.params.command;
        serialRead(command.substr(0, 5), res);
        serial.write(`${command}\r`, handleErrorResponse(res));
    });

    /* Area */

    router.get('/area/status/:id', (req, res) => {
        const input = `RA${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    router.get('/area/label/:id', (req, res) => {
        const input = `AL${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    router.get('/area/arm/:id', (req, res) => {
        const input = `AA${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}${armCode}${userCode}\r`, handleErrorResponse(res));
    });

    router.get('/area/quickarm/:id', (req, res) => {
        const input = `AQ${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}${armCode}${userCode}\r`, handleErrorResponse(res));
    });

    router.get('/area/disarm/:id', (req, res) => {
        const input = `AD${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}${userCode}\r`, handleErrorResponse(res));
    });

    router.get('/area/panic/emergency/:id', (req, res) => {
        const input = `PE${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    router.get('/area/panic/medical/:id', (req, res) => {
        const input = `PM${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    router.get('/area/panic/fire/:id', (req, res) => {
        const input = `PF${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    router.get('/area/smoke/reset/:id', (req, res) => {
        const input = `SR${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    /* Zone */

    router.get('/zone/status/:id', (req, res) => {
        const input = `RZ${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    router.get('/zone/label/:id', (req, res) => {
        const input = `ZL${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    /* User */

    router.get('/user/label/:id', (req, res) => {
        const input = `UL${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    /* Utility Keys */

    router.get('/utility/:id', (req, res) => {
        const input = `UK${req.params.id}`;
        serialRead(input, res);
        serial.write(`${input}\r`, handleErrorResponse(res));
    });

    return router;
};
