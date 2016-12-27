# Home Assistant Integration with Paradox Alarm

## Type of State in MQTT

- disarmed
- armed_home
- armed_away
- pending
- triggered

## Debug

stateTopic:
```
mosquitto_sub -v -t 'smartbox/paradox'
```

commandTopic:
```
mosquitto_sub -v -t 'smartbox/paradox/set'
```

test & retain data:
```
mosquitto_pub -t 'smartbox/paradox' -r -m 'disarmed'
```
