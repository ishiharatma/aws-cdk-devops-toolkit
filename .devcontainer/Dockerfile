FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bullseye

# Optional: Copy and update certificates for corporate proxy environments
## Copy and update certificates
#COPY .devcontainer/your-root-ca.cer /usr/local/share/ca-certificates/your-root-ca.crt
##RUN update-ca-certificates
## Configure npm certificate location and SSL settings
#RUN npm config set cafile /etc/ssl/certs/ca-certificates.crt \
#    && npm config set registry http://registry.npmjs.org/ \
#    && npm config set strict-ssl false
# Set AWS_CA_BUNDLE environment variable to the location of the CA bundle
#ENV AWS_CA_BUNDLE /usr/local/share/ca-certificates/your-root-ca.crt

# Install additional packages required for AWS CDK
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    python3 \
    python3-pip \
    jq \
    #git \
    curl \
    unzip \
    #docker.io \
    #docker-compose \
    #docker-compose-plugin \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install AWS Session Manager Plugin
RUN export CPU="" && \
    if [ $(uname -m) = "x86_64" ]; then \
    export CPU="ubuntu_64bit"; \
    elif [ $(uname -m) = "aarch64" ]; then \
    export CPU="ubuntu_arm64"; \
    fi && \
    if [ -n "$CPU" ]; then \
    curl "https://s3.amazonaws.com/session-manager-downloads/plugin/latest/${CPU}/session-manager-plugin.deb" \
    -o session-manager-plugin.deb && \
    apt-get update && \
    apt-get install -y ./session-manager-plugin.deb && \
    rm -rf ./session-manager-plugin.deb && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*; \
    else \
    echo "Unknown architecture for AWS Session Manager Plugin installation"; \
    fi

# Grant sudo privileges to the node user
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/node

# Set user to node
USER node
WORKDIR /home/node

# uvのインストール
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
# PATHに.local/binを追加
ENV PATH="/home/node/.local/bin:${PATH}"