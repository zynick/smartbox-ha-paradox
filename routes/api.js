'use strict';

const express = require('express');
const router = express.Router();
const SerialPort = require('serialport');

const serialInterpreter = require('./controller/serialInterpreter');
const serialResponse = require('./controller/serialResponse');

const SERIAL_PASS = '1234';
const ARM_CODE = 'A'; // A:Regular, F:Force, S:Stay, I:Instant


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
    console.log('serial port is opened.');
});

let _readData = function(buffer) {
    const output = buffer.toString();

    if (output.length === 12 && output.charAt(0) === 'G' &&
        output.charAt(4) === 'N' && output.charAt(8) === 'A') {
        serialInterpreter(output);
        return;
    }

    console.log('data received', output.length, output);
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
            return;
        }

        console.log('data received', output.length, output);

        if (res.headerSent) {
            return;
        }

        const result = serialResponse(input, output);
        if (result) {
            res.json(result);
        }

    };

    serial.on('data', _readData);
}

function write(res) {
    return (err) => {
        if (err) {
            console.log('ERROR', err);
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
