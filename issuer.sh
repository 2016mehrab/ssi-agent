#!/bin/bash

# Fetch the endpoint
AGENT_TUNNEL=$(curl --silent localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="agent") | .public_url')
CONTROLLER_TUNNEL=$(curl --silent localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="controller") | .public_url')
CONTROLLER_TUNNEL="${CONTROLLER_TUNNEL}/webhooks"
SEED="eshan111111111111111111111111112"

# Seed: eshan111111111111111111111111111
# DID: 2fQiCWu29TdhH7fPp3octb
# Verkey: uYfzE22qSukP8a1egCd6D5oQUXv99VzU9jmsMVfCVGo

# LATEST SEED
# Seed: eshan000000000000000000000000000
# DID: RTxPyPn968eFkQe8b2SXt2
# Verkey: EvF87VfxedyzKALMh7tf8kB3ZguVWXFNp223szzxshKr
# alias: eshan

# Winxp --seed Mehrab00000000000000000000000000 \
# Docker --seed fakeMehrab0000000000000000000000 \
# Define the command

CMD="aca-py start  --endpoint $AGENT_TUNNEL \
   --label basic-idp \
   --inbound-transport http 0.0.0.0 8020 \
   --outbound-transport http \
   --admin 0.0.0.0 8021 \
   --admin-insecure-mode \
   --auto-provision \
   --wallet-type askar \
   --wallet-name eshan26112 \
   --wallet-key eshanwsecret \
   --preserve-exchange-records \
   --genesis-url http://test.bcovrin.vonx.io/genesis \
   --trace-target log \
   --seed $SEED \
   --trace-tag idp.events \
   --trace-label idp.agent.trace \
   --auto-ping-connection \
   --auto-respond-messages \
   --auto-accept-invites \
   --auto-accept-requests \
   --auto-respond-credential-proposal \
   --auto-respond-credential-offer \
   --auto-respond-credential-request \
   --auto-store-credential \
   --public-invites \
   --webhook-url $CONTROLLER_TUNNEL \
   --debug-presentations \
   --debug-credentials \
   --debug-webhooks \
   --auto-verify-presentation \
   --debug-connections"

# Print the command
echo -e "Running command: $CMD"

# Execute the command
eval $CMD
