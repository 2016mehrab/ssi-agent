#!/bin/bash

# Fetch the endpoint
AGENT_TUNNEL=$(curl --silent localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="agent") | .public_url')
CONTROLLER_TUNNEL=$(curl --silent localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="controller") | .public_url')
CONTROLLER_TUNNEL="${CONTROLLER_TUNNEL}/webhooks"

# echo "Running control $CONTROLLER_TUNNEL"

# Define the command
CMD="aca-py start  --endpoint $AGENT_TUNNEL \
   --label ubuntu \
   --inbound-transport http 0.0.0.0 8020 \
   --outbound-transport http \
   --admin 0.0.0.0 8021 \
   --admin-insecure-mode \
   --wallet-type askar \
   --wallet-name ubuntuWallet \
   --wallet-key secret \
   --preserve-exchange-records \
   --auto-provision \
   --genesis-url http://dev.greenlight.bcovrin.vonx.io/genesis \
   --trace-target log \
   --seed fakeMehrab0000000000000000000000 \
   --trace-tag acapy.events \
   --trace-label faber.agent.trace \
   --auto-ping-connection \
   --auto-respond-messages \
   --auto-accept-invites \
   --auto-accept-requests \
   --auto-respond-credential-proposal \
   --auto-respond-credential-offer \
   --auto-respond-credential-request \
   --auto-store-credential \
   --debug-connections \
   --webhook-url $CONTROLLER_TUNNEL \
   --debug-presentations \
   --debug-credentials \
   --debug-webhooks \
   --auto-verify-presentation \
   --public-invites "

# Print the command
echo "Running command: $CMD"

# Execute the command
eval $CMD