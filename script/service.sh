#!/bin/bash

IP_ADDRESS=$1
SERVICE_PORT=$2
BASE_IP=$(echo ${1} | cut -d. -f1-3)
RANDOM_PORT=$((10000 + RANDOM % (65535 - 10000 + 1)))

echo "Random Port: $RANDOM_PORT"
echo "Executing script with arguments: $@"

if [ "$BASE_IP" == "10.0.1" ]; then
    echo "Setting up iptables rules for IP 10.0.1.x..."
    iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:${SERVICE_PORT}
    iptables -I FORWARD -o virbr1 -p tcp -d ${1} --dport ${SERVICE_PORT} -j ACCEPT
    iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:${SERVICE_PORT}
    echo "
iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:${SERVICE_PORT}
iptables -I FORWARD -o virbr1 -p tcp -d ${1} --dport ${SERVICE_PORT} -j ACCEPT
iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:${SERVICE_PORT}
    " >> /opt/iptables-backup
elif [ "$BASE_IP" == "10.0.10" ]; then
    echo "Setting up iptables rules for IP 10.0.10.x..."
    iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:${SERVICE_PORT}
    iptables -I FORWARD -o virbr2 -p tcp -d ${1} --dport ${SERVICE_PORT} -j ACCEPT
    iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:${SERVICE_PORT}
    echo "
iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:${SERVICE_PORT}
iptables -I FORWARD -o virbr2 -p tcp -d ${1} --dport ${SERVICE_PORT} -j ACCEPT
iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:${SERVICE_PORT}
    " >> /opt/iptables-backup
else
    echo "Setting up iptables rules for other IPs..."
    iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:${SERVICE_PORT}
    iptables -I FORWARD -o virbr3 -p tcp -d ${1} --dport ${SERVICE_PORT} -j ACCEPT
    iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:${SERVICE_PORT}
    echo "
iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:${SERVICE_PORT}
iptables -I FORWARD -o virbr3 -p tcp -d ${1} --dport ${SERVICE_PORT} -j ACCEPT
iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:${SERVICE_PORT}
    " >> /opt/iptables-backup
fi

# Output the Access Public
echo "Random Port: $RANDOM_PORT"
echo "This Port For Your Service in Public: $SSH_HOST:$RANDOM_PORT"