#!/usr/bin/env bash

export KEY_NAME="m0104_graph"
export GROUP="m0104_graph_sg"

#create security group
aws ec2 create-security-group \
  --region eu-west-1  \
  --group-name $GROUP \
  --description "Neo4j security group"

#set open ports in security group
for port in 22 7474 7473 7687; do
  aws ec2 authorize-security-group-ingress --group-name $GROUP --protocol tcp --port $port --cidr 0.0.0.0/0
done

#create instance
aws ec2 run-instances \
  --image-id ami-a797994d \
  --count 1 \
  --instance-type m3.medium \
  --key-name $KEY_NAME \
  --security-groups $GROUP \
  --query "Instances[*].InstanceId" \
  --region eu-west-1

