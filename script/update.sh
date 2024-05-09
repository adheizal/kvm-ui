#!/bin/bash

if [ "${1}" == "ubuntu" ]; then
    # Fetch Ubuntu type
    export TYPE=$(ssh 10.0.1.254 "hostnamectl | grep ubuntu | awk '{print $3}'")

    # Update IP based on Ubuntu type
    if [ "$TYPE" = "ubuntu-lite" ] || [ "$TYPE" = "ubuntu-kvm" ]; then
        ssh 10.0.1.254 "hostnamectl set-hostname '${2}'"
        ssh 10.0.1.254 "sudo sed -i 's/10.0.1.254/${3}/' /etc/netplan/50-cloud-init.yaml"
        ssh 10.0.1.254 "reboot"
    else
        ssh 10.0.1.254 "hostnamectl set-hostname '${2}'"
        ssh 10.0.1.254 "sudo sed -i 's/10.0.1.254/${3}/' /etc/netplan/00-installer-config.yaml"
        ssh 10.0.1.254 "reboot"
    fi
else
    ssh -l root 10.0.1.254 "hostnamectl set-hostname '${2}'"
    ssh -l root 10.0.1.254 "sed -i 's/IPADDR=10.0.1.254/IPADDR=${3}/' /etc/sysconfig/network-scripts/ifcfg-eth0"
    ssh -l root 10.0.1.254 "reboot"
fi