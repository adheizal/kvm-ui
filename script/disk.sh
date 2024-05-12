#!/bin/bash

virsh shutdown ${1} && sleep 20s
qemu-img resize /data/vms/${1} +${3}G
virsh start ${1} && sleep 30s

export UBUNTU_CODENAME=$(ssh -l root "${2}" hostnamectl |grep Ubuntu |awk '{print $3}')
if [ "$UBUNTU_CODENAME" == "Ubuntu" ]; then
    export TYPE=$(ssh ${2} cat /etc/hosts |grep normal |awk '{print $3}')
    if [ "$TYPE" = "normal" ] ; then
        ssh -l root ${2} "echo -e 'n\np\n\n\n\nw' | fdisk /dev/vda && echo -e 't\n\n8e\nw' | fdisk /dev/vda"
        export MOUNT=$(ssh -l root '${2}' "lsblk /dev/vda --noheadings --output NAME | tail -n 1|sed 's/└─//g'")
        ssh -l root ${2} "pvcreate /dev/$MOUNT"
        ssh -l root ${2} "vgextend /dev/ubuntu-vg /dev/$MOUNT"
        ssh -l root ${2} "lvresize --resizefs -l +100%FREE /dev/mapper/ubuntu--vg-ubuntu--lv"
    else
        ssh -l root ${2} "growpart /dev/vda 1"
        ssh -l root ${2} "resize2fs /dev/vda1"
    fi
else
    ssh -l root ${2} "growpart /dev/vda 1"
    ssh -l root ${2} "xfs_growfs /dev/vda1"
fi