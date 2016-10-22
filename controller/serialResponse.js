'use strict';

/* this should not be in routes directory. fix later */

/**
 * Alarm Type (www.paradox.com/Downloader/?ID=7504)
 *
 * Regular Arming:
 *   This method is used for the everyday arming of your system.
 *   All zones within the protected area must be closed to Regular arm the system.
 *
 * Stay Arming:
 *   Stay arming will partially arm your system to permit you to remain in your home or office
 *   by arming the outer zones (perimeter) of the protected area (i.e. doors and windows).
 *
 * Instant Arming:
 *   This feature is the same as Stay arming except that there is no Entry Delay.
 *   Therefore, any armed zone that is breached will immediately generate an alarm.
 *
 * Force Arming:
 *   Force arming allows you to quickly arm your system when zones are open.
 *   However, once the open zone is closed, your system will then arm that zone as well.
 */

module.exports = (input, output) => {

    const _header = output.substr(0, 5);
    const command = output.substr(0, 2);
    const result = output.charAt(5) === '&' ? output.substr(6) : output.substr(5);

    // Validations
    if (input !== _header) {
        return;
    }
    if (result === 'ok' || result === 'fail') {
        return result;
    }

    // Request Area Status
    if (command === 'RA') {
        const status = result.charAt(0);
        const statusDesc = {
            'D': 'Disarmed',
            'A': 'Armed',
            'F': 'Force armed',
            'S': 'Stay armed',
            'I': 'Instant armed'
        };

        return {
            status: `${status} - ${statusDesc[status]}`,
            zoneInMemory: result.charAt(1) === 'M',
            trouble: result.charAt(2) === 'T',
            notReady: result.charAt(3) === 'N',
            inProgramming: result.charAt(4) === 'P',
            inAlarm: result.charAt(5) === 'A',
            strobe: result.charAt(6) === 'S'
        };
    }

    // Request Zone Status
    if (command === 'RZ') {
        const status = result.charAt(0);
        const statusDesc = {
            'C': 'Closed',
            'O': 'Open',
            'T': 'Tampered',
            'F': 'Fire loop trouble'
        };

        return {
            status: `${status} - ${statusDesc[status]}`,
            inAlarm: result.charAt(1) === 'A',
            fireAlarm: result.charAt(2) === 'F',
            supervisionLost: result.charAt(3) === 'S',
            lowBattery: result.charAt(4) === 'L'
        };
    }

    return result.trim();

};
