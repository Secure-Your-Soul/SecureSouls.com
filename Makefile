.PHONY: dev deploy build clean install

# start dev server
dev:
	wrangler dev

# Deploy on producation
deploy:
	wrangler deploy

# Build Wasm (no run)
build:
	cd worker && worker-build --release

# Cleaning
clean:
	cargo clean
	rm -rf build/

# Install CLI tools (worker-build + wrangler)
install:
	@echo "==> Installing worker-build (Rust)"
	cargo install worker-build

	@echo "==> Configuring npm"
	@if [ -n "$$FLATPAK_ID" ]; then \
		echo "    Flatpak detected - setting npm prefix to ~/.local"; \
		npm config set prefix "$$HOME/.local"; \
	fi
	npm config set allow-scripts=esbuild,workerd --location=user

	@echo "==> Installing wrangler (npm)"
	npm install -g wrangler

	@echo ""
	@echo "==> Done!"
	@if ! echo "$$PATH" | tr ':' '\n' | grep -q "^$$HOME/.local/bin$$"; then \
		echo ""; \
		echo "⚠️  WARNING: $$HOME/.local/bin is not in PATH."; \
		echo "    Add to ~/.bashrc:"; \
		echo "      export PATH=\"\$$HOME/.local/bin:\$$PATH\""; \
		echo "    Then run: source ~/.bashrc"; \
	fi
