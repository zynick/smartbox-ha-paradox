'use strict';

const express    = require('express');
const router     = express.Router();
const serialport = require('serialport');
const serialSysEvent = require('./serialSystemEvents');
const serialResponse = require('./serialResponse');

const usbPort    = '/dev/tty.usbserial-a40069ba';
const serialPass = '1234';
const armCode    = 'I'; // A:Regular, F:Force, S:Stay, I:Instant
const serialOpts = {
                     baudrate: 2400,
                     dataBits: 8,
                     stopBits: 1,
                     parity: 'none',
                     parser: serialport.parsers.readline('\r')
                   };
const serial     = new serialport.SerialPort(usbPort, serialOpts);



serial.on('open', () => {
  console.log('serial port is opened.');
});


let readData = function() { };

function standardReadData(header, res) {

  serial.removeListener('data', readData);

  readData = function(buffer) {

    const output  = buffer.toString();

    if (output.length === 12     && output.charAt(0) === 'G' &&
        output.charAt(4) === 'N' && output.charAt(8) === 'A') {
      serialSysEvent(output);
      return;
    }

    console.log('data received', output.length, output);

    if (res.headerSent) { return; }

    const result = serialResponse(header, output);
    if (result) {
      res.json(result);
    }

  };

  serial.on('data', readData);
}

function standardWriteData(res) {
  return (err) => {
    if (err) {
      console.log('ERROR', err);
      if (!res.headerSent) { res.send(err); }
    }
  };
}


router.get('/command/:command', (req, res, next) => {
  const command = req.params.command;
  standardReadData(command.substr(0,5), res);
  serial.write(`${command}\r`, standardWriteData);
});

router.get('/area/status/:id', (req, res, next) => {
  const header = `RA${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/area/label/:id', (req, res, next) => {
  const header = `AL${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/area/arm/:id', (req, res, next) => {
  const header = `AA${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}${armCode}${serialPass}\r`, standardWriteData);
});

router.get('/area/quickarm/:id', (req, res, next) => {
  const header = `AQ${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}${armCode}${serialPass}\r`, standardWriteData);
});

router.get('/area/disarm/:id', (req, res, next) => {
  const header = `AD${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}${serialPass}\r`, standardWriteData);
});

router.get('/area/panic/emergency/:id', (req, res, next) => {
  const header = `PE${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/area/panic/medical/:id', (req, res, next) => {
  const header = `PM${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/area/panic/fire/:id', (req, res, next) => {
  const header = `PF${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/area/smoke/reset/:id', (req, res, next) => {
  const header = `SR${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/zone/status/:id', (req, res, next) => {
  const header = `RZ${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/zone/label/:id', (req, res, next) => {
  const header = `ZL${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/user/label/:id', (req, res, next) => {
  const header = `UL${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});

router.get('/utility/:id', (req, res, next) => {
  const header = `UK${req.params.id}`;
  standardReadData(header, res);
  serial.write(`${header}\r`, standardWriteData);
});



module.exports = router;
