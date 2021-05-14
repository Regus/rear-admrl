#!/bin/bash
echo "Updating"
sudo apt update -y
sudo apt upgrade -y

if [ -f "$HOME/.nvm/nvm.sh" ]; then
  echo "NVM already installed"
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
else
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
fi

nvm install --lts

echo "NodeJS Installation Complete"
echo "nvm: $(nvm --version)"
echo "node: $(node -v)"
echo "npm: $(npm -v)"

npm install
npm run initialize


