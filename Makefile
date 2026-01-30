# Makefile for Apollo GUI

.PHONY: install-deps build run-local

# Install dependencies
install-deps:
	npm install

# Build the project for deployment (Production)
# Sets the API URL to the production endpoint
build:
	VITE_API_URL=https://app.functori.com/reth npm run build

# Run the project locally (Development)
run-local:
	npm run dev
