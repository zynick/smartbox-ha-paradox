'use strict';

/**
 * Interpret Serial Data (System Event) to Human Readable Messages
 */

const debug = require('debug')('app:serialInterpreter');

const gDesc = {
    '000': 'Zone is OK',
    '001': 'Zone is Open',
    '002': 'Zone is Tampered',
    '003': 'Zone is in Fire Loop Trouble',
    '004': 'Non-reportable Event',
    '005': 'User Code Entered on Keypad',
    '006': 'User/Card Access on door',
    '007': 'Bypass Programming Access',
    '009': '___ Arming with Master',
    '010': '___ Arming with User Code',
    '011': '___ Arming with Keyswitch',
    '012': '___ Special Arming',
    '013': '___ Disarm with Master',
    '014': '___ Disarm with User Code',
    '015': '___ Disarm with Keyswitch',
    '016': '___ Disarm after Alarm with Master',
    '017': '___ Disarm after Alarm with User Code',
    '018': '___ Disarm after Alarm with Keyswitch',
    '019': '___ Alarm Cancelled with Master',
    '020': '___ Alarm Cancelled with User Code',
    '021': '___ Alarm Cancelled with Keyswitch',
    '022': '___ Special Disarm Events',
    '023': 'Zone Bypassed',
    '024': '___ Zone in Alarm',
    '025': 'Fire Alarm',
    '026': '___ Zone Alarm Restore',
    '027': 'Fire Alarm Restore',
    '028': 'Early to Disarm by User',
    '029': 'Late to Disarm by User',
    '030': 'Special Alarm',
    '031': 'Duress Alarm by User',
    '032': 'Zone Shutdown',
    '033': 'Zone Tamper',
    '034': 'Zone Tamper Restore',
    '035': 'Special Tamper',
    '036': 'Trouble Event',
    '037': 'Trouble Restore',
    '038': 'Module Trouble',
    '039': 'Module Trouble Restore',
    '040': 'Fail to Communicate on telephone Number',
    '041': 'Low Battery on Zone',
    '042': 'Zone Supervision Trouble',
    '043': 'Low Battery on Zone Restored',
    '044': 'Zone Supervision Trouble Restored',
    '045': 'Special Events',
    '046': 'Early to Arm by User',
    '047': 'Late to Arm by User',
    '048': 'Utility Key',
    '049': 'Request for Exit',
    '050': 'Access Denied',
    '051': 'Door Left Open Alarm',
    '052': 'Door Forced Alarm',
    '053': 'Door Left Open Restore',
    '054': 'Door Forced Open Restore',
    '055': 'Intellizone Triggered',
    '056': 'Zone Excluded on Force Arming',
    '057': 'Zone Went Back to Arm Status',
    '058': 'New Module Assigned on Combus',
    '059': 'Module Manually Removed From Combus',
    '060': 'Future Use',
    '061': 'Future Use',
    '062': 'Access Granted to User',
    '063': 'Access Denied to User',
    '064': '___ Status 1',
    '065': 'Status 2',
    '066': 'Status 3',
    '067': 'Future Use'
};

const nDesc = {
    '000': 'Zone Number',
    '001': 'Zone Number',
    '002': 'Zone Number',
    '003': 'Zone Number',
    '004': {
        '000': 'TLM Trouble',
        '001': 'Smoke detector reset',
        '002': 'Arm with no entry delay',
        '003': 'Arm in Stay mode',
        '004': 'Arm in Away mode',
        '005': 'Full arm when in Stay mode',
        '006': 'Voice module access',
        '007': 'Remote control access',
        '008': 'PC Fail to communicate',
        '009': 'Midnight',
        '010': 'NEware User Login',
        '011': 'NEware User Logout',
        '012': 'User Initiated Callup',
        '013': 'Force Answer',
        '014': 'Force Hangup'
    },
    '005': 'User Code',
    '006': 'Door Number',
    '007': 'User Code', // except 000: One-touch Bypass Programming
    '008': 'Zone Number',
    '009': 'User Code',
    '010': 'User Code',
    '011': 'Keyswitch numbers',
    '012': {
        '000': 'Auto Arming',
        '001': 'Arming by WinLoad',
        '002': 'Late to Close',
        '003': 'No Movement Arming',
        '004': 'Partial Arming',
        '005': 'One-touch Arming',
        '006': 'Future Use',
        '007': 'Future Use',
        '008': '(InTouch) Voice Module Arming'
    },
    '013': 'User Code',
    '014': 'User Code',
    '015': 'Keyswitch Number',
    '016': 'User Code',
    '017': 'User Code',
    '018': 'Keyswitch Number',
    '019': 'User Code',
    '020': 'User Code',
    '021': 'Keyswitch Number',
    '022': {
        '000': 'Auto Arm Cancelled',
        '001': 'One-touch Stay/Instant Disarm',
        '002': 'Disarming with WinLoad',
        '003': 'Disarming with WinLoad after alarm',
        '004': 'WinLoad cancelled alarm',
        '005': 'Future Use',
        '006': 'Future Use',
        '007': 'Future Use',
        '008': '(InTouch) Voice Module Disarming'
    },
    '023': 'Zone Number',
    '024': 'Zone Number',
    '025': 'Zone Number',
    '026': 'Zone Number',
    '027': 'Zone Number',
    '028': 'User Code',
    '029': 'User Code',
    '030': {
        '000': 'Emergency Panic (Keys 1 & 3)',
        '001': 'Medical Panic (Keys 4 & 6)',
        '002': 'Fire Panic (Keys 7 & 9)',
        '003': 'Recent Closing',
        '004': 'Police Code',
        '005': 'Global Shutdown'
    },
    '031': 'User Code',
    '032': 'Zone Number',
    '033': 'Zone Number',
    '034': 'Zone Number',
    '035': 'Keypad Lockout',
    '036': {
        '000': 'TLM Trouble',
        '001': 'AC Failure',
        '002': 'Battery Failure',
        '003': 'Auxiliary Current Limit',
        '004': 'Bell Current Limit',
        '005': 'Bell Absent',
        '006': 'Clock Trouble',
        '007': 'Global Fire Loop'
    },
    '037': {
        '000': 'TLM Trouble',
        '001': 'AC Failure',
        '002': 'Battery Failure',
        '003': 'Auxiliary Current Limit',
        '004': 'Bell Current Limit',
        '005': 'Bell Absent',
        '006': 'Clock Trouble',
        '007': 'Global Fire Loop'
    },
    '038': {
        '000': 'Combus Fault',
        '001': 'Module Tamper',
        '002': 'ROM/RAM error',
        '003': 'TLM Trouble',
        '004': 'Fail to Communicate',
        '005': 'Printer Fault',
        '006': 'AC Failure',
        '007': 'Battery Failure',
        '008': 'Auxiliary Failure'
    },
    '039': {
        '000': 'Combus Fault',
        '001': 'Module Tamper',
        '002': 'ROM/RAM error',
        '003': 'TLM Trouble',
        '004': 'Fail to Communicate',
        '005': 'Printer Fault',
        '006': 'AC Failure',
        '007': 'Battery Failure',
        '008': 'Auxiliary Failure'
    },
    '040': 'Telephone Number',
    '041': 'Zone Number',
    '042': 'Zone Number',
    '043': 'Zone Number',
    '044': 'Zone Number',
    '045': {
        '000': 'Power up after total power down',
        '001': 'Software reset (Watchdog)',
        '002': 'Test Report',
        '003': 'Future Use',
        '004': 'WinLoad In (connected)',
        '005': 'WinLoad Out (disconnected)',
        '006': 'Installer in programming',
        '007': 'Installer out of programming'
    },
    '046': 'User Code',
    '047': 'User Code',
    '048': 'Utility Key',
    '049': 'Door Number',
    '050': 'Door Number',
    '051': 'Door Number',
    '052': 'Door Number',
    '053': 'Door Number',
    '054': 'Door Number',
    '055': 'Zone Number',
    '056': 'Zone Number',
    '057': 'Zone Number',
    '058': 'Module Address',
    '059': 'Module Address',
    '060': 'Future Use',
    '061': 'Future Use',
    '062': 'User Code',
    '063': 'User Code',
    '064': {
        '000': 'Armed',
        '001': 'Force Armed',
        '002': 'Stay Armed',
        '003': 'Instant Armed',
        '004': 'Strobe Alarm',
        '005': 'Silent Alarm',
        '006': 'Audible Alarm',
        '007': 'Fire Alarm'
    },
    '065': {
        '000': 'Ready',
        '001': 'Exit Delay',
        '002': 'Entry Delay',
        '003': 'System In Trouble',
        '004': 'Alarm in  Memory',
        '005': 'Zones Bypassed',
        '006': 'Bypass, Master, Installer Programming',
        '007': 'Keypad Lockout'
    },
    '066': {
        '000': 'Intellizone Delay Engaged',
        '001': 'Fire Delay Engaged',
        '002': 'Auto Arm',
        '003': 'Arming with Voice Module (set until Exit Delay finishes)',
        '004': 'Tamper',
        '005': 'Zone Low Battery',
        '006': 'Fire Loop Trouble',
        '007': 'Zone Supervision Trouble'
    },
    '067': 'Future Use'
};

module.exports = (output) => {
    const _g = output.substr(1, 3);
    const _n = output.substr(5, 3);
    const _a = output.substr(9, 3);

    const _gDesc = gDesc[_g] || 'Unknown';

    let _nDesc = nDesc[_g];
    if (typeof _nDesc === 'object') {
        _nDesc = _nDesc[_n] || 'Unknown';
    } else if (typeof _nDesc === 'string') {
        _nDesc += ' ' + _n;
    } else {
        _nDesc = 'Unknown';
    }

    debug(`G${_g} N${_n} A${_a}: ${_gDesc} | ${_nDesc} | Area ${_a}`);
};
