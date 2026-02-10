FROM node:22-bookworm-slim

# Install Chrome dependencies
RUN apt-get update
RUN apt-get install -y \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libgbm-dev \
  libasound2 \
  libxrandr2 \
  libxkbcommon-dev \
  libxfixes3 \
  libxcomposite1 \
  libxdamage1 \
  libatk-bridge2.0-0 \
  libpango-1.0-0 \
  libcairo2 \
  libcups2 \
  fonts-noto-color-emoji
RUN rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN chown -R node:node /app

USER node

# Copy package files first (better caching)
COPY --chown=node:node package.json package*.json tsconfig.json* remotion.config.* ./

# Install dependencies as the node user
RUN npm i

# Install Chrome
# Remotion will download Chromium to /home/node/.cache/remotion/browser
RUN npx remotion browser ensure

# Copy the rest of the source code
COPY --chown=node:node src ./src

CMD ["npx", "remotion", "preview"]