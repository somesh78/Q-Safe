#!/bin/bash
# Quick SSH connection to EC2 server
# Usage: ./ssh-ec2.sh

PEM_KEY="$HOME/Downloads/q-safeSSH-Key.pem"
EC2_USER="ubuntu"

# Prompt for EC2 IP if not set
if [ -z "$1" ]; then
    read -p "Enter EC2 IP address: " EC2_IP
else
    EC2_IP="$1"
fi

echo "🔐 Connecting to $EC2_IP..."
ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP"
