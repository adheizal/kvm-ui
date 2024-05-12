#!/bin/bash

if [ "${1}" == "ubuntu" ]; then
    TYPE_OUTPUT=$(ssh $TEMPLATE_IP "hostnamectl | grep ubuntu")
    echo "Output of hostnamectl: ${TYPE_OUTPUT}"  # Debugging output

    # Extract Ubuntu type from the output
    export TYPE=$(echo "${TYPE_OUTPUT}" | awk '{print $3}')
    echo "Ubuntu type: ${TYPE}"  # Debugging output

    # Update IP based on Ubuntu type
    if [ "$TYPE" = "ubuntu-lite" ] || [ "$TYPE" = "ubuntu-kvm" ] ; then
        ssh $TEMPLATE_IP "hostnamectl set-hostname '${2}'"
        ssh $TEMPLATE_IP "sudo sed -i 's/${TEMPLATE_IP}/${3}/' /etc/netplan/50-cloud-init.yaml"
        ssh $TEMPLATE_IP "reboot"
    else
        ssh $TEMPLATE_IP "hostnamectl set-hostname '${2}'"
        ssh $TEMPLATE_IP "sudo sed -i 's/${TEMPLATE_IP}/${3}/' /etc/netplan/00-installer-config.yaml"
        ssh $TEMPLATE_IP "reboot"
    fi
else
    ssh -l root $TEMPLATE_IP "hostnamectl set-hostname '${2}'"
    ssh -l root $TEMPLATE_IP "sed -i 's/IPADDR=${TEMPLATE_IP}/IPADDR=${3}/' /etc/sysconfig/network-scripts/ifcfg-eth0"
    ssh -l root $TEMPLATE_IP "reboot"
fi