FROM ubuntu
MAINTAINER ESHAN_SSI

# Update the package list
RUN apt-get update

# Install software
RUN apt-get install -y nodejs vim curl python3 python3-pip npm jq git

# Install ngrok
RUN curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | tee /etc/apt/sources.list.d/ngrok.list && apt-get update && apt-get install -y ngrok

# Install acapy
# RUN pip install aries-cloudagent
# RUN pip install aries_askar
# RUN pip install indy_credx
# RUN pip install anoncreds
# RUN pip install indy_vdr

# pip install aries-cloudagent;pip install aries_askar;pip install indy_credx;pip install anoncreds;pip install indy_vdr;
# pip install --no-cache-dir  --force-reinstall aries-cloudagent
# pip install --no-cache-dir --force-reinstall 'aries-cloudagent<0.12.0'
# pip install --no-cache-dir  --force-reinstall aries_askar
# pip install --no-cache-dir  --force-reinstall indy_credx
# pip install --no-cache-dir  --force-reinstall anoncreds
# pip install --no-cache-dir  --force-reinstall indy_vdr






# Create directories
# RUN mkdir -p /root/controller/src/routes
# RUN mkdir -p /root/.config/ngrok

# Initialize a new npm project
# WORKDIR /root/controller
# RUN npm init -y

# Install ngrok
# WORKDIR /
