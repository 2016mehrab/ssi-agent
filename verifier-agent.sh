#!/bin/bash

# Fetch the endpoint
AGENT_TUNNEL=$(curl --silent localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="agent") | .public_url')
CONTROLLER_TUNNEL=$(curl --silent localhost:4040/api/tunnels | jq -r '.tunnels[] | select(.name=="controller") | .public_url')
CONTROLLER_TUNNEL="${CONTROLLER_TUNNEL}/webhooks"
SEED="verifier000000000000000000000000"
WALLET_NAME="verifierWallet"
WALLET_KEY="verifierWalletSecret"

# Seed: verifier000000000000000000000000
# DID: 9NzxkszeRBc543N5QHUYGA
# Verkey: 5ZtQ2YkyeLUwi9NHeqigURfoin8s6HwK7B8jx76LVViQ


CMD="aca-py start  --endpoint $AGENT_TUNNEL \
   --label Verifier \
   --inbound-transport http 0.0.0.0 8020 \
   --outbound-transport http \
   --admin 0.0.0.0 8021 \
   --admin-insecure-mode \
   --wallet-type askar \
   --wallet-name $WALLET_NAME \
   --wallet-key $WALLET_KEY \
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
   --auto-provision \
   --debug-connections"

# Print the command
echo -e "Running command: $CMD"

# Execute the command
eval $CMD
