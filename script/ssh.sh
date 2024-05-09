#!/bin/bash

# Function to generate a random port number
generate_random_port() {
    shuf -i 10000-65535 -n 1
}

BASE_IP=$(echo ${1} | cut -d. -f1-3)

# Generate a random port number
RANDOM_PORT=$(generate_random_port)
PORT=22

echo "Random Port: $RANDOM_PORT"

echo "Executing script with arguments: $@"

if [ "$BASE_IP" == "10.0.1" ]; then
    echo "Setting up iptables rules for IP 10.0.1.x..."
    ssh -l $SSH_USER $SSH_HOST "iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:$PORT"
    ssh -l $SSH_USER $SSH_HOST "iptables -I FORWARD -o virbr1 -p tcp -d ${1} --dport $PORT -j ACCEPT"
    ssh -l $SSH_USER $SSH_HOST "iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:$PORT "
    echo "
iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:$PORT
iptables -I FORWARD -o virbr1 -p tcp -d ${1} --dport $PORT -j ACCEPT
iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:$PORT
    " >> /opt/iptables-backup
elif [ "$BASE_IP" == "10.0.10" ]; then
    echo "Setting up iptables rules for IP 10.0.10.x..."
    ssh -l $SSH_USER $SSH_HOST "iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:$PORT"
    ssh -l $SSH_USER $SSH_HOST "iptables -I FORWARD -o virbr2 -p tcp -d ${1} --dport $PORT -j ACCEPT"
    ssh -l $SSH_USER $SSH_HOST "iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:$PORT "
    echo "
iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:$PORT
iptables -I FORWARD -o virbr2 -p tcp -d ${1} --dport $PORT -j ACCEPT
iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:$PORT
    " >> /opt/iptables-backup
else
    echo "Setting up iptables rules for other IPs..."
    ssh -l $SSH_USER $SSH_HOST "iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:$PORT"
    ssh -l $SSH_USER $SSH_HOST "iptables -I FORWARD -o virbr3 -p tcp -d ${1} --dport $PORT -j ACCEPT"
    ssh -l $SSH_USER $SSH_HOST "iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:$PORT "
    echo "
iptables -t nat -I PREROUTING -i enp7s0 -p tcp -d $SSH_HOST --dport $RANDOM_PORT -j DNAT --to-destination ${1}:$PORT
iptables -I FORWARD -o virbr3 -p tcp -d ${1} --dport $PORT -j ACCEPT
iptables -t nat -I PREROUTING -p tcp --dport $RANDOM_PORT -j DNAT --to ${1}:$PORT
    " >> /opt/iptables-backup
fi

# Output the SSH command for access
echo "For Access your VM: ssh -l $SSH_USER $SSH_HOST -p $RANDOM_PORT"