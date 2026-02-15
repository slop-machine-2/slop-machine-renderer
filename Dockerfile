FROM oven/bun:latest

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
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
  fonts-noto-color-emoji \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# The official Bun image uses the 'bun' user
RUN chown -R bun:bun /app

USER bun

# Copy package files (including bun.lockb if you have it)
COPY --chown=bun:bun package.json bun.lock* tsconfig.json* remotion.config.* ./

# Install dependencies using Bun
RUN bun install

# Install Chrome
# Remotion will download Chromium to /home/bun/.cache/remotion/browser
RUN bunx remotion browser ensure

# Copy the rest of the source code
COPY --chown=bun:bun src ./src

CMD ["bunx", "remotion", "preview"]