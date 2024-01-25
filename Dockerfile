FROM ubuntu
MAINTAINER ESHAN_SSI

# Update the package list
RUN apt-get update

# Install software
RUN apt-get install -y nodejs vim curl python3 python3-pip npm jq

# Install ngrok
RUN curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list && apt-get update && apt-get install -y ngrok

# Install acapy
RUN pip install aries-cloudagent
RUN pip install aries_askar
RUN pip install indy_credx
RUN pip install indy_vdr

# Create directories
# RUN mkdir -p /root/controller/src/routes
# RUN mkdir -p /root/.config/ngrok

# Initialize a new npm project
# WORKDIR /root/controller
# RUN npm init -y

# Install ngrok
# WORKDIR /
